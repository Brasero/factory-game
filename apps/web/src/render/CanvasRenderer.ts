import type {World} from "@engine/models/World.ts";
import type {Position} from "@engine/models/Position.ts";
import {colors} from "@web/theme/colors.ts";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {config} from "@web/config/gridConfig.ts";
import {imagePath} from "@web/config/assets.registry.ts";
import {machineConfig} from "@web/config/machineConfig.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import type {Storage} from "@engine/models/Storage.ts";
import {drawStorageTooltip, drawStorages} from "@web/render/utils/storage.ts"
import {drawResourceNodes} from "@web/render/utils/node.ts";
import {drawConveyors, getIncomingDirection} from "@web/render/utils/conveyor.ts";
import type {Camera} from "@web/model/Camera.ts";
import {drawDecorationTiles, drawTileMap} from "@web/render/utils/tiles.ts";

const CELL_SIZE = config.CELL_SIZE;
const width = window.innerWidth;
const height = window.innerHeight;
export function render(
    ctx: CanvasRenderingContext2D,
    world: World,
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
    drawResourceNodes(ctx, world.grid);
    drawConveyors(ctx, world);
    drawMachines(ctx, world);
    drawResources(ctx, world);
    drawStorages(ctx, world);
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
function drawMachines(
  ctx: CanvasRenderingContext2D,
  world: World
) {
    world.machines.forEach(m => {
        const isWorking = m.active;
        const spritePrefix = m.spriteName!
        const state = isWorking ? "running": "idle";
        const type = m.type === "water-pump" ? "pump" : "miner"
        const spriteKey = `machine.${type}.${spritePrefix}.${state}`
        const sprite = assetManager.getImage(spriteKey);
        if (!sprite) return;
        const baseX = m.x * CELL_SIZE;
        const baseY = m.y * CELL_SIZE;
        
        const drawX = m.type === "water-pump" ? baseX : baseX - OFFSET;
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
        const frameCount = m.type === "water-pump" ? machineConfig.PUMP_FRAME_COUNT : machineConfig.MINER_FRAME_COUNT
        const frameIndex = (Math.floor(machineConfig.ANIMATION_SPEED * world.tick)% SPRITE_SIZE) % frameCount;
        const sx = frameIndex * SPRITE_SIZE;
        
        ctx.drawImage(
          sprite,
          sx, 0,
          SPRITE_SIZE, SPRITE_SIZE,
          drawX, drawY,
          SPRITE_SIZE, SPRITE_SIZE
        )
    })
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
function drawResources(ctx: CanvasRenderingContext2D, world: World) {
    const resourceColors: Record<ResourcesType, string> = {
        iron: imagePath.ore.ironOre,
        coal: imagePath.ore.coalOre,
        water: imagePath.ore.waterOre
    }
    
    world.conveyors.forEach(c => {
        if (!c.carrying.length) return;
        c.carrying.forEach(r => {
            const { type, progress = 0 } = r;
            
            // Position de base au centre de la case
            const path = buildConveyorPath(world, c, CELL_SIZE);
            const pos = interpolateOnConveyor(path, progress)
            
            const image = new Image()
            image.src = resourceColors[type];
            ctx.drawImage(
              image,
              pos.x - 10, pos.y - 15,
              CELL_SIZE - 10, CELL_SIZE - 10
            );
        })
    });
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
  world: World,
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
  world: World,
  conveyor: Conveyor,
  cellSize: number
): ConveyorPath {
    const prev = findPreviousConveyor(world, conveyor);
    
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