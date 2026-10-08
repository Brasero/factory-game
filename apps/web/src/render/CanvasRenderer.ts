import {visibleCells, isVisible, type ViewportBounds} from "./utils/viewport";
import {acceptsInput, directions, nextPosition, outputDirections, positionKey} from "@engine/systems/NetworkTopology";
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
import {drawPipeAt} from "@web/render/utils/pipe";
import {machineFootprint, machineFootprintCells, machineOutputPosition, machineOutputSource} from "@engine/config/machineFootprint";

import {getSmokeTextures, getCornerSmokeTexture} from "./utils/smokeTexture";
import {conveyorVisualProgress, type ConveyorMotion} from "./utils/conveyorMotion";

const CELL_SIZE = config.CELL_SIZE;
export function render(
    ctx: CanvasRenderingContext2D,
    world: WorldSnapshot,
    camera?: Camera,
    hoveredCell?: Position & {canPlace: boolean; footprint?: Position[]},
    hoveredStorage?: Storage,
    measure?: (layer: string, milliseconds: number) => void,
    tickInterpolation = 0,
    visualTimeMs = 0,
    conveyorMotion?: ConveyorMotion
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
    drawLayer("entities", () => drawDynamicEntities(ctx, world, bounds, tickInterpolation, conveyorMotion));
    drawLayer("decorations", () => drawDecorationTiles(ctx, world.grid!, bounds));
    drawLayer("fog", () => drawCampaignFog(ctx, world));
    drawLayer("pollution", () => drawPollutionSmoke(ctx, world, visualTimeMs));
    drawHoveredCell(ctx, hoveredCell);
    if (hoveredStorage) {
        drawStorageTooltip(ctx, hoveredStorage);
    }
}

export function pollutionSmokeState(pollution: number, limit: number): {intensity: number; reach: number; opacity: number} {
  const ratio = limit > 0 ? Math.min(1, Math.max(0, pollution / limit)) : 0;
  const intensity = Math.max(0, (ratio - 0.1) / 0.9);
  if (intensity === 0) return {intensity: 0, reach: 0, opacity: 0};
  return {
    intensity,
    reach: 0.48 * Math.pow(intensity, 0.7),
    opacity: 0.72 * Math.pow(intensity, 0.75)
  };
}

function drawCornerSmokeGradient(ctx: CanvasRenderingContext2D, radius: number, opacity: number) {
  const {width, height} = ctx.canvas;
  const corners = [
    {x: 0, y: 0},
    {x: width, y: 0},
    {x: width, y: height},
    {x: 0, y: height}
  ];
  const texture = getCornerSmokeTexture();
  for (const corner of corners) {
    if (texture) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(texture, corner.x - radius, corner.y - radius, radius * 2, radius * 2);
      continue;
    }
    const gradient = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, radius);
    gradient.addColorStop(0, `rgba(40, 38, 36, ${opacity})`);
    gradient.addColorStop(0.58, `rgba(67, 62, 57, ${opacity * 0.48})`);
    gradient.addColorStop(1, "rgba(78, 72, 66, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawSmokePatch(ctx: CanvasRenderingContext2D, texture: HTMLImageElement, variant: number,
  x: number, y: number, size: number, rotation: number) {
  const frameWidth = texture.naturalWidth / 2;
  const frameHeight = texture.naturalHeight / 2;
  const frame = ((variant % 4) + 4) % 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const softened = getSmokeTextures(texture)?.[frame];
  if (softened) ctx.drawImage(softened, -size / 2, -size / 2, size, size);
  else ctx.drawImage(texture, frame % 2 * frameWidth, Math.floor(frame / 2) * frameHeight, frameWidth, frameHeight,
    -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function pollutionSmokeLayerVisibility(intensity: number, layer: number): number {
  return Math.min(1, Math.max(0, intensity * 3 - layer));
}

export function pollutionSmokeMotion(visualTimeMs: number, layer: number, spacing: number): {offset: number; tileShift: number} {
  const travel = visualTimeMs * 0.0075 * (0.45 + layer * 0.17);
  return {offset: travel % spacing, tileShift: Math.floor(travel / spacing)};
}

const smokeStateCache = new WeakMap<CanvasRenderingContext2D, {pollution: number; time: number}>();

function drawPollutionSmoke(ctx: CanvasRenderingContext2D, world: WorldSnapshot, visualTimeMs: number) {
  const previous = smokeStateCache.get(ctx);
  const elapsed = previous ? Math.max(0, visualTimeMs - previous.time) : 0;
  const pollution = previous && elapsed < 1000 && elapsed > 0
    ? previous.pollution + (world.campaign.pollution - previous.pollution) * (1 - Math.exp(-elapsed / 180))
    : world.campaign.pollution;
  smokeStateCache.set(ctx, {pollution, time: visualTimeMs});
  const state = pollutionSmokeState(pollution, world.campaign.pollutionLimit);
  if (state.intensity === 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const {width, height} = ctx.canvas;
  const reachRadius = Math.hypot(width, height) * state.reach;
  drawCornerSmokeGradient(ctx, reachRadius, state.opacity * 0.72);

  const texture = assetManager.getImage("effect.pollutionSmoke");
  const size = Math.max(112, Math.min(260, Math.min(width, height) * 0.26));
  const spacing = size * 0.68;
  const layers = 3;
  const corners = [
    {x: 0, y: 0, startAngle: 0},
    {x: width, y: 0, startAngle: Math.PI / 2},
    {x: width, y: height, startAngle: Math.PI},
    {x: 0, y: height, startAngle: Math.PI * 1.5}
  ];
  ctx.imageSmoothingEnabled = true;

  for (let layer = 0; layer < layers; layer += 1) {
    const visibility = pollutionSmokeLayerVisibility(state.intensity, layer);
    if (visibility === 0) continue;
    const radius = reachRadius * (layer + 0.55) / layers;
    const angleStep = spacing / Math.max(radius, spacing);
    const {offset, tileShift} = pollutionSmokeMotion(visualTimeMs, layer, spacing);
    const opacity = state.opacity * (0.82 - layer / layers * 0.3) * visibility;
    for (let cornerIndex = 0; cornerIndex < corners.length; cornerIndex += 1) {
      const corner = corners[cornerIndex];
      let index = layer + cornerIndex - tileShift;
      for (let angle = corner.startAngle - angleStep + offset / Math.max(radius, 1);
        angle <= corner.startAngle + Math.PI / 2 + angleStep; angle += angleStep) {
        // Les particules entrent et sortent en fondu, sans apparition au bouclage.
        const edge = Math.min((angle - corner.startAngle + angleStep) / angleStep,
          (corner.startAngle + Math.PI / 2 + angleStep - angle) / angleStep, 1);
        ctx.globalAlpha = opacity * Math.max(0, edge);
        drawSmokePatch(ctx, texture, index++, corner.x + Math.cos(angle) * radius,
          corner.y + Math.sin(angle) * radius, size, angle + Math.PI / 2);
      }
    }
  }
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

const renderNetworkCache = new WeakMap<WorldSnapshot, ReturnType<typeof buildRenderNetwork>>();

function buildRenderNetwork(world: WorldSnapshot) {
  const previousByPos = new Map<string, Conveyor>();
  const incomingByPos = new Map<string, DirectionType>();
  const conveyorsByPos = new Map(world.conveyors.map(conveyor => [positionKey(conveyor), conveyor]));
  const connectedOutputs = new Set<string>();
  const connected = connectedRouterIds(world.conveyors);

  world.conveyors.forEach(conveyor => {
    for (const direction of outputDirections(conveyor)) {
      const key = positionKey(nextPosition(conveyor, direction));
      const receiver = conveyorsByPos.get(key);
      // Un tapis refusé par son voisin (face à face) n'en est pas le prédécesseur : aucun sprite de demi-tour.
      if (!receiver || !acceptsInput(receiver, conveyor)) continue;
      connectedOutputs.add(conveyor.id);
      const existing = previousByPos.get(key);
      if (!existing || conveyor.y < existing.y || (conveyor.y === existing.y && conveyor.x < existing.x)) {
        previousByPos.set(key, conveyor);
        incomingByPos.set(key, getIncomingDirection(conveyor, receiver));
      }
    }
  });

  const registerEntityOutput = (source: Position, direction: DirectionType) => {
    const key = positionKey(nextPosition(source, direction));
    const receiver = conveyorsByPos.get(key);
    if (!receiver || !acceptsInput(receiver, source) || incomingByPos.has(key)) return;
    incomingByPos.set(key, direction);
  };
  world.machines.forEach(machine => registerEntityOutput(machineOutputSource(machine), machine.type === "water-pump" ? "right" : "down"));
  world.tunnels.filter(tunnel => tunnel.type === "input")
    .forEach(tunnel => registerEntityOutput(tunnel, tunnel.direction));
  world.storages.forEach(storage => directions.forEach(direction => registerEntityOutput(storage, direction)));

  const receivers = new Set([
    ...world.machines.flatMap(machine => machineFootprintCells(machine).map(positionKey)),
    ...world.storages.map(positionKey),
    ...world.tunnels.filter(tunnel => tunnel.type === "output").map(positionKey)
  ]);
  const machinesByCell = new Map(world.machines.flatMap(machine => machineFootprintCells(machine)
    .map(cell => [positionKey(cell), machine] as const)));
  world.conveyors.forEach(conveyor => {
    if (outputDirections(conveyor).some(direction => {
      const targetKey = positionKey(nextPosition(conveyor, direction));
      const machine = machinesByCell.get(targetKey);
      return receivers.has(targetKey) && (!machine || positionKey(conveyor) !== positionKey(machineOutputPosition(machine)));
    })) {
      connectedOutputs.add(conveyor.id);
    }
  });

  return {previousByPos, incomingByPos, connectedOutputs, connected};
}

function drawDynamicEntities(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  bounds: ViewportBounds,
  tickInterpolation: number,
  conveyorMotion?: ConveyorMotion
) {
  const drawCalls: DrawCall[] = [];
  let network = renderNetworkCache.get(world);
  if (!network) {
    network = buildRenderNetwork(world);
    renderNetworkCache.set(world, network);
  }
  const {previousByPos, incomingByPos, connectedOutputs, connected} = network;
  (world.pipes ?? []).forEach(pipe => {
    if (!isVisible(pipe, bounds)) return;
    drawCalls.push({x: pipe.x, y: pipe.y, layer: 0, draw: () => drawPipeAt(ctx, world, pipe, CELL_SIZE)});
  });

  world.conveyors.forEach(conveyor => {
    if (!isVisible(conveyor, bounds)) return;
    const prev = previousByPos.get(`${conveyor.x},${conveyor.y}`) ?? null;
    const incoming = incomingByPos.get(positionKey(conveyor));
    const path = buildConveyorPath(world, conveyor, CELL_SIZE, prev, incoming);
    drawCalls.push({
      x: conveyor.x,
      y: conveyor.y,
      layer: 0,
      draw: () => drawConveyorAt(ctx, world, conveyor, prev, connected.has(conveyor.id), tickInterpolation,
        connectedOutputs.has(conveyor.id), incoming)
    });
    if (conveyor.type === "conveyor" && conveyor.carrying.length) {
      drawCalls.push({
        x: conveyor.x,
        y: conveyor.y,
        layer: 1,
        draw: () => drawResourcesForConveyor(ctx, conveyor, path, tickInterpolation, conveyorMotion)
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
  steel: "ACIER", copper: "CUIVRE", copperWire: "FIL", circuit: "CIRCUIT",
  uranium: "URANIUM", uraniumCell: "CELLULE", processingUnit: "CALCUL", automationCore: "CŒUR"
};

function statusPresentation(reason: MachineIdleReason): {label: string; color: string} {
  switch (reason.type) {
    case "paused": return {label: "⏸ PAUSE", color: "#4f86c6"};
    case "no-recipe": return {label: "? RECETTE", color: "#9b59b6"};
    case "missing-any-input": return {label: "! RESSOURCE", color: "#d88924"};
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
  const footprint = machineFootprint(machine.type);
  const x = machine.x * CELL_SIZE + footprint.width * CELL_SIZE / 2 - width / 2;
  const y = machine.y * CELL_SIZE - 24;
  ctx.fillStyle = "rgba(15, 20, 28, 0.94)";
  ctx.fillRect(x - 1, y - 1, width + 2, 13);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, 11);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 7px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, machine.x * CELL_SIZE + footprint.width * CELL_SIZE / 2, y + 5.5);
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
    if (machine.type === "advanced-assembler") {
        const sprite = assetManager.getImage(`machine.automation.advancedAssembler.${isWorking ? "running" : "idle"}`);
        const frameWidth = 96;
        const frameHeight = 80;
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % 4 : 0;
        ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, frameHeight,
          machine.x * CELL_SIZE - 16, machine.y * CELL_SIZE - 48, frameWidth, frameHeight);
        return;
    }
    if (machine.type === "boiler") {
        const sprite = assetManager.getImage(`machine.automation.boiler.${isWorking ? "running" : "idle"}`);
        const frameWidth = 64;
        const frameHeight = 48;
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % 2 : 0;
        ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, frameHeight,
          machine.x * CELL_SIZE, machine.y * CELL_SIZE - 16, frameWidth, frameHeight);
        return;
    }
    if (machine.type === "recycler") {
        const sprite = assetManager.getImage(`machine.automation.recycler.${isWorking ? "running" : "idle"}`);
        const drawX = machine.x * CELL_SIZE - 8;
        const drawY = machine.y * CELL_SIZE - 16;
        const frame = isWorking ? Math.floor(machineConfig.ANIMATION_SPEED * world.tick) % 4 : 0;
        ctx.drawImage(sprite, frame * 48, 0, 48, 48, drawX, drawY, 48, 48);
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
  const sprite = assetManager.getImage(`machine.tunnel.${tunnel.type}`);
  ctx.drawImage(sprite, x - 16, y - 32, 64, 64);
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
  cell?: Position & {canPlace: boolean; footprint?: Position[]}
) {
    if (!cell) return
    ctx.fillStyle = cell.canPlace ? colors.state.success : colors.state.danger;
    for (const position of cell.footprint ?? [cell]) {
      ctx.fillRect(position.x * CELL_SIZE, position.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
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
  circuit: "ore.circuit",
  uranium: "ore.uraniumOre",
  uraniumCell: "ore.uraniumCell",
  processingUnit: "ore.processingUnit",
  automationCore: "ore.automationCore"
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
  tickInterpolation: number,
  motion?: ConveyorMotion
) {
    if (!conveyor.carrying.length) return;
    conveyor.carrying.forEach((r, index) => {
        const {type} = r;
        
        // Position de base au centre de la case
        const visualProgress = conveyorVisualProgress(conveyor, index, tickInterpolation, motion);
        const pos = interpolateOnConveyor(path, visualProgress)
        
        drawResourceIcon(ctx, type, pos.x - 10, pos.y - 15, CELL_SIZE - 10);
    })
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
  prevOverride?: Conveyor | null,
  incomingOverride?: DirectionType
): ConveyorPath {
    const prev = prevOverride === undefined ? findPreviousConveyor(world, conveyor) : prevOverride;
    
    const center = {
        x: conveyor.x * cellSize + cellSize / 2,
        y: conveyor.y * cellSize + cellSize / 2
    };
    
    const outgoing = conveyor.direction;
    const incoming = incomingOverride ?? (prev
      ? getIncomingDirection(prev, conveyor)
      : outgoing);
    
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
