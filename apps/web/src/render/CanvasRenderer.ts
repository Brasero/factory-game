import {visibleCells, isVisible, type ViewportBounds} from "./utils/viewport";
import {acceptsInput, positionKey} from "@engine/systems/NetworkTopology";
import type {
  WorldSnapshot,
  Position,
  Conveyor,
  DirectionType,
  ResourcesType,
  Storage
} from "@engine/api/types.ts";
import {colors} from "@web/theme/colors.ts";
import {config} from "@web/config/gridConfig.ts";
import {machineConfig} from "@web/config/machineConfig.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import {drawStorageTooltip, drawStorageAt} from "@web/render/utils/storage.ts"
import {drawResourceNodes} from "@web/render/utils/node.ts";
import {connectedRouterIds, drawConveyorAt, getIncomingDirection} from "@web/render/utils/conveyor.ts";
import type {Camera} from "@web/model/Camera.ts";
import {drawDecorationTiles, drawTileMap} from "@web/render/utils/tiles.ts";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {machineIdleReason, type MachineIdleReason} from "@engine/systems/MachineStatus";

const CELL_SIZE = config.CELL_SIZE;
export function render(
    ctx: CanvasRenderingContext2D,
    world: WorldSnapshot,
    camera?: Camera,
    hoveredCell?: Position & {canPlace: boolean},
    hoveredStorage?: Storage,
    measure?: (layer: string, milliseconds: number) => void,
    tickInterpolation = 0
) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (camera) {
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.scale, camera.scale);
    }
    
    if (!world.grid) return;
    const bounds = visibleCells(ctx.canvas.width, ctx.canvas.height, CELL_SIZE,
      camera ?? {x: 0, y: 0, scale: 1}, world.grid.width, world.grid.height);
    const drawLayer = (name: string, draw: () => void) => {
        if (!measure) { draw(); return; }
        const start = performance.now();
        draw();
        measure(name, performance.now() - start);
    };
    drawLayer("terrain", () => drawTileMap(ctx, world.grid!, bounds));
    drawLayer("resources", () => drawResourceNodes(ctx, world.grid!, bounds));
    drawLayer("entities", () => drawDynamicEntities(ctx, world, bounds, tickInterpolation));
    drawLayer("decorations", () => drawDecorationTiles(ctx, world.grid!, bounds));
    drawLayer("fog", () => drawCampaignFog(ctx, world));
    drawLayer("pollution", () => drawPollutionHaze(ctx, world));
    drawHoveredCell(ctx, hoveredCell);
    if (hoveredStorage) {
        drawStorageTooltip(ctx, hoveredStorage);
    }
}

export function pollutionHazeOpacity(pollution: number, limit: number): number {
  const ratio = limit > 0 ? Math.min(1, Math.max(0, pollution / limit)) : 0;
  const visibleRatio = Math.max(0, (ratio - 0.1) / 0.9);
  return 0.52 * Math.pow(visibleRatio, 1.35);
}

function drawPollutionHaze(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  const opacity = pollutionHazeOpacity(world.campaign.pollution, world.campaign.pollutionLimit);
  if (opacity === 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(78, 68, 54, ${opacity})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const vignette = ctx.createRadialGradient(
    ctx.canvas.width / 2, ctx.canvas.height / 2, Math.min(ctx.canvas.width, ctx.canvas.height) * 0.18,
    ctx.canvas.width / 2, ctx.canvas.height / 2, Math.max(ctx.canvas.width, ctx.canvas.height) * 0.72
  );
  vignette.addColorStop(0, "rgba(52, 57, 50, 0)");
  vignette.addColorStop(1, `rgba(35, 31, 25, ${Math.min(0.38, opacity * 0.8)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/* ========================= */
/* ======== MACHINES ======= */
/* ========================= */
const SPRITE_SIZE = 48;
const OFFSET = (SPRITE_SIZE - CELL_SIZE) / 2;
const LAYERS = 3;
const ROWS = Math.ceil(config.HEIGHT / CELL_SIZE);
const COLS = Math.ceil(config.WIDTH / CELL_SIZE);
const KEY_COUNT = ROWS * LAYERS * COLS;
const countByKey = new Uint32Array(KEY_COUNT);
const positionByKey = new Uint32Array(KEY_COUNT);
type DrawCall = {
  y: number;
  x: number;
  layer: number;
  draw: () => void;
};

function drawDynamicEntities(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  bounds: ViewportBounds,
  tickInterpolation: number
) {
  const drawCalls: DrawCall[] = [];
  const previousByPos = new Map<string, Conveyor>();
  const conveyorsByPos = new Map(world.conveyors.map(conveyor => [positionKey(conveyor), conveyor]));
  const connected = connectedRouterIds(world.conveyors);

  world.conveyors.forEach(conveyor => {
    const key = positionKey(getNextPosition(conveyor));
    const receiver = conveyorsByPos.get(key);
    // Un tapis refusé par son voisin (face à face) n'en est pas le prédécesseur : aucun sprite de demi-tour.
    if (!receiver || !acceptsInput(receiver, conveyor)) return;
    const existing = previousByPos.get(key);
    if (!existing || conveyor.y < existing.y || (conveyor.y === existing.y && conveyor.x < existing.x)) {
      previousByPos.set(key, conveyor);
    }
  });

  world.conveyors.forEach(conveyor => {
    if (!isVisible(conveyor, bounds)) return;
    const prev = previousByPos.get(`${conveyor.x},${conveyor.y}`) ?? null;
    const path = buildConveyorPath(world, conveyor, CELL_SIZE, prev);
    drawCalls.push({
      x: conveyor.x,
      y: conveyor.y,
      layer: 0,
      draw: () => drawConveyorAt(ctx, world, conveyor, prev, connected.has(conveyor.id))
    });
    if (conveyor.type === "conveyor" && conveyor.carrying.length) {
      drawCalls.push({
        x: conveyor.x,
        y: conveyor.y,
        layer: 1,
      draw: () => drawResourcesForConveyor(ctx, conveyor, path, tickInterpolation)
      });
    }
  });

  world.machines.forEach(machine => {
    if (!isVisible(machine, bounds)) return;
    drawCalls.push({
      x: machine.x,
      y: machine.y,
      layer: 2,
      draw: () => {
        drawMachineAt(ctx, world, machine);
        drawMachineStatus(ctx, world, machine);
      }
    });
  });

  world.storages.forEach(storage => {
    if (!isVisible(storage, bounds)) return;
    drawCalls.push({
      x: storage.x,
      y: storage.y,
      layer: 2,
      draw: () => drawStorageAt(ctx, storage)
    });
  });

  world.tunnels.forEach(tunnel => {
    if (!isVisible(tunnel, bounds)) return;
    drawCalls.push({x: tunnel.x, y: tunnel.y, layer: 2, draw: () => drawTunnel(ctx, tunnel)});
  });

  drawCallsSorted(drawCalls);
}

const RESOURCE_SHORT_NAMES: Record<ResourcesType, string> = {
  iron: "FER", coal: "CHARBON", water: "EAU", ironPlate: "LINGOT",
  steel: "ACIER", copper: "CUIVRE", copperWire: "FIL", circuit: "CIRCUIT"
};

function statusPresentation(reason: MachineIdleReason): {label: string; color: string} {
  switch (reason.type) {
    case "paused": return {label: "⏸ PAUSE", color: "#4f86c6"};
    case "no-recipe": return {label: "? RECETTE", color: "#9b59b6"};
    case "missing-input": return {label: `! ${RESOURCE_SHORT_NAMES[reason.resource]}`, color: "#d88924"};
    case "output-full": return {label: `■ ${RESOURCE_SHORT_NAMES[reason.resource]}`, color: "#c0392b"};
    case "buffer-full": return {label: "■ STOCK", color: "#c0392b"};
    case "pollution-empty": return {label: "✓ AIR PROPRE", color: "#31845b"};
  }
}

function drawMachineStatus(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  machine: WorldSnapshot["machines"][number]
) {
  if (machine.active) return;
  const reason = machineIdleReason(machine, world.campaign.pollution);
  if (!reason) return;
  const {label, color} = statusPresentation(reason);
  const width = Math.max(34, label.length * 5 + 8);
  const x = machine.x * CELL_SIZE + CELL_SIZE / 2 - width / 2;
  const y = machine.y * CELL_SIZE - 24;
  ctx.fillStyle = "rgba(15, 20, 28, 0.94)";
  ctx.fillRect(x - 1, y - 1, width + 2, 13);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, 11);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 7px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, machine.x * CELL_SIZE + CELL_SIZE / 2, y + 5.5);
}

function drawCallsSorted(drawCalls: DrawCall[]) {
  const count = countByKey;
  const positions = positionByKey;
  count.fill(0);

  const keys = new Uint32Array(drawCalls.length);
  for (let i = 0; i < drawCalls.length; i++) {
    const call = drawCalls[i];
    const key = ((call.y * LAYERS + call.layer) * COLS + call.x) >>> 0;
    keys[i] = key;
    count[key] += 1;
  }

  let total = 0;
  for (let i = 0; i < KEY_COUNT; i++) {
    const c = count[i];
    positions[i] = total;
    total += c;
  }

  const ordered = new Array<DrawCall>(drawCalls.length);
  for (let i = 0; i < drawCalls.length; i++) {
    const key = keys[i];
    const pos = positions[key]++;
    ordered[pos] = drawCalls[i];
  }

  ordered.forEach(call => call.draw());
}

function drawMachineAt(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  machine: WorldSnapshot["machines"][number]
) {
    const isWorking = machine.active;
    if (machine.type === "iron-smelter" || machine.type === "steel-smelter") {
        const sprite = isWorking ? assetManager.getImage("machine.automation.ironSmelter.running") : assetManager.getImage("machine.automation.ironSmelter.idle");
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % machineConfig.IRON_SMELTER_FRAME_COUNT : 0;
        const frameWidth = isWorking ? machineConfig.IRON_SMELTER_RUNNING_CELL_WIDTH : machineConfig.IRON_SMELTER_IDLE_CELL_WIDTH
        const frameHeight = isWorking ? machineConfig.IRON_SMELTER_RUNNING_CELL_HEIGHT : machineConfig.IRON_SMELTER_IDLE_CELL_HEIGHT
        const drawSize =  machineConfig.IRON_SMELTER_DRAW_SIZE;
        const drawOffsetWidth = (frameWidth - CELL_SIZE) / 2;
        const drawOffsetHeight = (frameHeight - CELL_SIZE);
        const drawX = machine.x * CELL_SIZE - drawOffsetWidth;
        const drawY = machine.y * CELL_SIZE - drawOffsetHeight;
        ctx.drawImage(
          sprite,
          frame * frameWidth,
          0,
          frameWidth,
          frameHeight,
          drawX,
          drawY,
          frameWidth,
          frameHeight
        );
        if (isWorking) {
            const particles = assetManager.getImage("machine.automation.ironSmelterParticles");
            const particleFrame = Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % machineConfig.IRON_SMELTER_PARTICLE_FRAME_COUNT;
            const particleColumn = particleFrame % machineConfig.IRON_SMELTER_PARTICLE_COLUMNS;
            const particleRow = Math.floor(particleFrame / machineConfig.IRON_SMELTER_PARTICLE_COLUMNS);
            const particleSize = machineConfig.IRON_SMELTER_PARTICLE_DRAW_SIZE;
            ctx.drawImage(
              particles,
              particleColumn * machineConfig.IRON_SMELTER_PARTICLE_SIZE,
              particleRow * machineConfig.IRON_SMELTER_PARTICLE_SIZE,
              machineConfig.IRON_SMELTER_PARTICLE_SIZE,
              machineConfig.IRON_SMELTER_PARTICLE_SIZE,
              drawX + drawSize * 0.5 - particleSize * 0.5,
              drawY - particleSize * 0.15,
              particleSize,
              particleSize
            );
        }
        return;
    }
    if (machine.type === "wire-mill" || machine.type === "assembler") {
        const variant = machine.variant ?? "standard";
        const sprite = assetManager.getImage(`machine.automation.assembler.${variant}.${isWorking ? "running" : "idle"}`);
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % 4 : 0;
        const frameWidth = variant === "eco" ? 32 : 48;
        const frameHeight = 48;
        ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, frameHeight,
          machine.x * CELL_SIZE - (frameWidth - CELL_SIZE) / 2, machine.y * CELL_SIZE - 16, frameWidth, frameHeight);
        return;
    }
    if (machine.type === "boiler") {
        const sprite = assetManager.getImage(`machine.automation.boiler.${isWorking ? "running" : "idle"}`);
        const frameWidth = 64;
        const frameHeight = 48;
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % 2 : 0;
        ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, frameHeight,
          machine.x * CELL_SIZE - 16, machine.y * CELL_SIZE - 16, frameWidth, frameHeight);
        return;
    }
    const spritePrefix = machine.spriteName!
    const state = isWorking ? "running": "idle";
    const type = machine.type === "water-pump" ? "pump" : "miner"
    const spriteKey = `machine.${type}.${spritePrefix}.${state}`
    const sprite = assetManager.getImage(spriteKey);
    if (!sprite) return;
    const baseX = machine.x * CELL_SIZE;
    const baseY = machine.y * CELL_SIZE;
    const minerFrameWidth = spritePrefix === "miner1"
      ? machineConfig.MINER_ECO_FRAME_WIDTH : machineConfig.MINER_STANDARD_FRAME_WIDTH;
    const frameWidth = machine.type === "water-pump" ? SPRITE_SIZE : minerFrameWidth;
    const frameHeight = machine.type === "water-pump" ? SPRITE_SIZE : machineConfig.MINER_FRAME_HEIGHT;
    const drawX = machine.type === "water-pump" ? baseX : baseX - (frameWidth - CELL_SIZE) / 2;
    const drawY = baseY - OFFSET;
    
    if (!isWorking) {
        ctx.drawImage(
          sprite,
          0, 0,
          frameWidth, frameHeight,
          drawX, drawY,
          frameWidth, frameHeight
        )
        return;
    }
    const frameCount = machine.type === "water-pump" ? machineConfig.PUMP_FRAME_COUNT : machineConfig.MINER_FRAME_COUNT
    const frameIndex = Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % frameCount;
    const sx = frameIndex * frameWidth;
    
    ctx.drawImage(
      sprite,
      sx, 0,
      frameWidth, frameHeight,
      drawX, drawY,
      frameWidth, frameHeight
    )
}

function drawTunnel(ctx: CanvasRenderingContext2D, tunnel: WorldSnapshot["tunnels"][number]) {
  const x = tunnel.x * CELL_SIZE;
  const y = tunnel.y * CELL_SIZE;
  ctx.fillStyle = tunnel.type === "output" ? "#24324d" : "#193f43";
  ctx.fillRect(x, y + 4, CELL_SIZE, CELL_SIZE - 4);
  ctx.fillStyle = tunnel.type === "output" ? "#fdcb6e" : "#00cec9";
  ctx.fillRect(x + 5, y + 9, CELL_SIZE - 10, CELL_SIZE - 9);
  ctx.fillStyle = "#0e111b";
  ctx.fillRect(x + 9, y + 13, CELL_SIZE - 18, CELL_SIZE - 13);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(tunnel.type === "output" ? "→" : "⇥", x + 10, y + 27);
}

function drawCampaignFog(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  for (const definition of CAMPAIGN_LEVELS) {
    const status = world.campaign.levels.find(level => level.id === definition.id)?.status;
    if (status !== "locked") continue;
    const radius = definition.radius * CELL_SIZE;
    const x = definition.center.x * CELL_SIZE;
    const y = definition.center.y * CELL_SIZE;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 20, 35, 0.74)";
    ctx.fill();
    ctx.strokeStyle = "rgba(184, 193, 236, 0.45)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("ÎLE VERROUILLÉE", x, y - 4);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "rgba(184,193,236,0.9)";
    ctx.fillText(definition.name, x, y + 19);
    ctx.restore();
  }
}



/* ========================= */
/* ======== SURVOL ======= */
/* ========================= */

function drawHoveredCell(
  ctx: CanvasRenderingContext2D,
  cell?: Position & {canPlace: boolean}
) {
    if (!cell) return
    ctx.fillStyle = cell.canPlace ? colors.state.success : colors.state.danger;
    ctx.fillRect(
      cell.x * CELL_SIZE,
      cell.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    )
}




/* ========================= */
/* RESSOURCES SUR CONVOYEURS */
/* ========================= */
const resourceSprites: Record<ResourcesType, string> = {
  iron: "ore.ironOre",
  coal: "ore.coalOre",
  water: "ore.waterOre",
  ironPlate: "ore.ironPlate",
  steel: "ore.steel",
  copper: "ore.copperOre",
  copperWire: "ore.copperWire",
  circuit: "ore.circuit"
};

function drawResourceIcon(
  ctx: CanvasRenderingContext2D,
  type: ResourcesType,
  x: number,
  y: number,
  size: number
) {
    const sprite = assetManager.getImage(resourceSprites[type]);
    ctx.drawImage(sprite, x, y, size, size);
}

function drawResourcesForConveyor(
  ctx: CanvasRenderingContext2D,
  conveyor: Conveyor,
  path: ConveyorPath,
  tickInterpolation: number
) {
    if (!conveyor.carrying.length) return;
    let aheadProgress: number | undefined;
    conveyor.carrying.forEach(r => {
        const { type, progress = 0 } = r;
        
        // Position de base au centre de la case
        const visualProgress = interpolatedConveyorProgress(progress, conveyor.speed, tickInterpolation, aheadProgress);
        aheadProgress = visualProgress;
        const pos = interpolateOnConveyor(path, visualProgress)
        
        drawResourceIcon(ctx, type, pos.x - 10, pos.y - 15, CELL_SIZE - 10);
    })
}

export function interpolatedConveyorProgress(
  progress: number,
  speed: number,
  tickInterpolation: number,
  aheadProgress?: number
): number {
  const destination = aheadProgress === undefined ? 1 : Math.max(0, aheadProgress - 0.35);
  return Math.min(destination, Math.max(0, progress + speed * Math.min(1, Math.max(0, tickInterpolation))));
}
export function directionToVector(dir: DirectionType): Position {
    switch (dir) {
        case "right": return { x: 1, y: 0 };
        case "left": return { x: -1, y: 0 };
        case "down": return { x: 0, y: 1 };
        case "up": return { x: 0, y: -1 };
    }
}
export function getNextPosition(
  conveyor: Conveyor
): Position {
    const v = directionToVector(conveyor.direction);
    return { x: conveyor.x + v.x, y: conveyor.y + v.y };
}
export function findPreviousConveyor(
  world: WorldSnapshot,
  current: Conveyor
): Conveyor | undefined {
    return world.conveyors.find(c => {
        const next = getNextPosition(c);
        return next.x === current.x && next.y === current.y && acceptsInput(current, c);
    });
}
export function getEntryPoint(
  center: Position,
  dir: DirectionType,
  size: number
): Position {
    const h = size / 2;
    switch (dir) {
        case "right": return { x: center.x - h, y: center.y };
        case "left": return { x: center.x + h, y: center.y };
        case "down": return { x: center.x, y: center.y - h };
        case "up": return { x: center.x, y: center.y + h };
    }
}
export function getExitPoint(
  center: Position,
  dir: DirectionType,
  size: number
): Position {
    const h = size / 2;
    switch (dir) {
        case "right": return { x: center.x + h, y: center.y };
        case "left": return { x: center.x - h, y: center.y };
        case "down": return { x: center.x, y: center.y + h };
        case "up": return { x: center.x, y: center.y - h };
    }
}
export interface ConveyorPath {
    entry: Position;
    corner: Position;
    exit: Position;
    isTurn: boolean;
}
export function buildConveyorPath(
  world: WorldSnapshot,
  conveyor: Conveyor,
  cellSize: number,
  prevOverride?: Conveyor | null
): ConveyorPath {
    const prev = prevOverride === undefined ? findPreviousConveyor(world, conveyor) : prevOverride;
    
    const center = {
        x: conveyor.x * cellSize + cellSize / 2,
        y: conveyor.y * cellSize + cellSize / 2
    };
    
    const outgoing = conveyor.direction;
    const incoming = prev
      ? getIncomingDirection(prev, conveyor)
      : outgoing;
    
    return {
        entry: getEntryPoint(center, incoming, cellSize),
        exit: getExitPoint(center, outgoing, cellSize),
        corner: center,
        isTurn: incoming !== outgoing
    };
}

export function lerp(a: Position, b: Position, t: number): Position {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
    };
}
export function interpolateOnConveyor(
  path: ConveyorPath,
  progress: number
): Position {
    if (!path.isTurn) {
        return lerp(path.entry, path.exit, progress);
    }
    
    if (progress < 0.5) {
        return lerp(path.entry, path.corner, progress * 2);
    }
    
    return lerp(path.corner, path.exit, (progress - 0.5) * 2);
}
