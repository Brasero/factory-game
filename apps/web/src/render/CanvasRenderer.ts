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
import {drawConveyorAt, getIncomingDirection} from "@web/render/utils/conveyor.ts";
import type {Camera} from "@web/model/Camera.ts";
import {drawDecorationTiles, drawTileMap} from "@web/render/utils/tiles.ts";

const CELL_SIZE = config.CELL_SIZE;
const width = window.innerWidth;
const height = window.innerHeight;
export function render(
    ctx: CanvasRenderingContext2D,
    world: WorldSnapshot,
    camera?: Camera,
    hoveredCell?: Position & {canPlace: boolean},
    hoveredStorage?: Storage
) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    
    if (camera) {
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.scale, camera.scale);
    }
    
    if (!world.grid) return;
    drawTileMap(ctx, world.grid);
    drawResourceNodes(ctx, world.grid); // Dessin des nœuds de ressources
    drawDynamicEntities(ctx, world); // Dessin des entitées dynamiques
    drawDecorationTiles(ctx, world.grid);
    drawHoveredCell(ctx, hoveredCell);
    if (hoveredStorage) {
        drawStorageTooltip(ctx, hoveredStorage);
    }
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
  world: WorldSnapshot
) {
  const drawCalls: DrawCall[] = [];
  const previousByPos = new Map<string, Conveyor>();

  world.conveyors.forEach(conveyor => {
    const next = getNextPosition(conveyor);
    previousByPos.set(`${next.x},${next.y}`, conveyor);
  });

  world.conveyors.forEach(conveyor => {
    const prev = previousByPos.get(`${conveyor.x},${conveyor.y}`);
    const path = buildConveyorPath(world, conveyor, CELL_SIZE, prev);
    drawCalls.push({
      x: conveyor.x,
      y: conveyor.y,
      layer: 0,
      draw: () => drawConveyorAt(ctx, world, conveyor)
    });
    if (conveyor.carrying.length) {
      drawCalls.push({
        x: conveyor.x,
        y: conveyor.y,
        layer: 1,
        draw: () => drawResourcesForConveyor(ctx, conveyor, path)
      });
    }
  });

  world.machines.forEach(machine => {
    drawCalls.push({
      x: machine.x,
      y: machine.y,
      layer: 2,
      draw: () => drawMachineAt(ctx, world, machine)
    });
  });

  world.storages.forEach(storage => {
    drawCalls.push({
      x: storage.x,
      y: storage.y,
      layer: 2,
      draw: () => drawStorageAt(ctx, storage)
    });
  });

  drawCallsSorted(drawCalls);
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
    const spritePrefix = machine.spriteName!
    const state = isWorking ? "running": "idle";
    const type = machine.type === "water-pump" ? "pump" : "miner"
    const spriteKey = `machine.${type}.${spritePrefix}.${state}`
    const sprite = assetManager.getImage(spriteKey);
    if (!sprite) return;
    const baseX = machine.x * CELL_SIZE;
    const baseY = machine.y * CELL_SIZE;
    
    const drawX = machine.type === "water-pump" ? baseX : baseX - OFFSET;
    const drawY = baseY - OFFSET;
    
    if (!isWorking) {
        ctx.drawImage(
          sprite,
          0, 0,
          SPRITE_SIZE, SPRITE_SIZE,
          drawX, drawY,
          SPRITE_SIZE, SPRITE_SIZE
        )
        return;
    }
    const frameCount = machine.type === "water-pump" ? machineConfig.PUMP_FRAME_COUNT : machineConfig.MINER_FRAME_COUNT
    const frameIndex = (Math.floor(machineConfig.ANIMATION_SPEED * world.tick)% SPRITE_SIZE) % frameCount;
    const sx = frameIndex * SPRITE_SIZE;
    
    ctx.drawImage(
      sprite,
      sx, 0,
      SPRITE_SIZE, SPRITE_SIZE,
      drawX, drawY,
      SPRITE_SIZE, SPRITE_SIZE
    )
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
  water: "ore.waterOre"
};

function drawResourcesForConveyor(
  ctx: CanvasRenderingContext2D,
  conveyor: Conveyor,
  path: ConveyorPath
) {
    if (!conveyor.carrying.length) return;
    conveyor.carrying.forEach(r => {
        const { type, progress = 0 } = r;
        
        // Position de base au centre de la case
        const pos = interpolateOnConveyor(path, progress)
        
        const sprite = assetManager.getImage(resourceSprites[type]);
        if (!sprite) return;
        ctx.drawImage(
          sprite,
          pos.x - 10, pos.y - 15,
          CELL_SIZE - 10, CELL_SIZE - 10
        );
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
        return next.x === current.x && next.y === current.y;
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
  prevOverride?: Conveyor
): ConveyorPath {
    const prev = prevOverride ?? findPreviousConveyor(world, conveyor);
    
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