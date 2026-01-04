import type {World} from "@engine/models/World.ts";
import type {Position} from "@engine/models/Position.ts";
import {colors} from "@web/theme/colors.ts";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {config} from "@web/config/gridConfig.ts";
import {drawConveyor, getConveyorSpriteCoords} from "@web/render/SpriteSheetLoader.ts";

const CELL_SIZE = config.CELL_SIZE;

export function render(
    ctx: CanvasRenderingContext2D,
    world: World,
    hoveredCell?: Position & {canPlace: boolean}
) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    const conveyorMap = new Map<string, Conveyor>();
    
    for (const c of world.conveyors) {
        conveyorMap.set(`${c.x}:${c.y}`, c);
    }
    
    drawGrid(ctx, width, height);
    drawResourceNodes(ctx, world);
    drawMachines(ctx, world);
    drawConveyors(ctx, world, conveyorMap);
    drawResources(ctx, world, conveyorMap);
    drawStorages(ctx, world);
    drawHoveredCell(ctx, hoveredCell);
}

/* ========================= */
/* ========== GRID ========= */
/* ========================= */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += CELL_SIZE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

/* ========================= */
/* ======== MACHINES ======= */
/* ========================= */

function drawMachines(
  ctx: CanvasRenderingContext2D,
  world: World
) {
    world.machines.forEach(m => {
        ctx.fillStyle = colors.machine.extractor;
        ctx.fillRect(m.x * CELL_SIZE + 4, m.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8)
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
/* == NOEUD DE RESSOURCES == */
/* ========================= */

function drawResourceNodes(
  ctx: CanvasRenderingContext2D,
  world: World
) {
    world.resourceNodes.forEach(node => {
        switch (node.resource) {
            case "iron":
                ctx.fillStyle = colors.resource.iron;
                break;
            case "coal":
                ctx.fillStyle = colors.resource.coal;
                break;
            case "water":
                ctx.fillStyle = colors.resource.water;
                break;
        }
        ctx.fillRect(
          node.x * CELL_SIZE,
          node.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        )
    })
}

/* ========================= */
/*  CONVOYEUR DE RESOURCES   */
/* ========================= */

function drawConveyors(ctx: CanvasRenderingContext2D, world: World) {
    world.conveyors.forEach(c => {
        const px = c.x * CELL_SIZE;
        const py = c.y * CELL_SIZE;
        
        const previousConveyor = findPreviousConveyor(world, c);
        const outgoing = c.direction
        const incoming = previousConveyor ? getIncomingDirection(previousConveyor, c) : outgoing;
        console.log(previousConveyor)
        console.log(`incoming : ${incoming}`, `outgoing: ${outgoing}`)
        
        const {sx, sy} = getConveyorSpriteCoords(incoming, outgoing)
        drawConveyor(ctx, sx, sy, CELL_SIZE, px, py);
        
     });
}




/* ========================= */
/*  COFFRES DE RESOURCES   */
/* ========================= */

function drawStorages(ctx: CanvasRenderingContext2D, world: World) {
    world.storages.forEach(s => {
        ctx.fillStyle = colors.machine.logistics;
        ctx.fillRect(s.x*CELL_SIZE+2, s.y*CELL_SIZE+2, CELL_SIZE-4, CELL_SIZE-4);
        
        // Affichage quantité
        ctx.fillStyle = colors.text.primary;
        ctx.font = "12px sans-serif";
        ctx.fillText(
          Object.entries(s.stored).map(([type, qty]) => `${type[0] === "i" ? "🪨":type[0]}:${qty}`).join("\r\n"),
          s.x*CELL_SIZE+2,
          s.y*CELL_SIZE+(CELL_SIZE/2)
        );
    });
}

/* ========================= */
/*  PREVIEW CONVOYEURS       */
/* ========================= */

export function drawPreviewConveyor(ctx: CanvasRenderingContext2D, x: number, y: number, direction: DirectionType) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const {sx, sy} = getConveyorSpriteCoords(direction, direction);
    ctx.globalAlpha = 0.5;
    drawConveyor(ctx, sx, sy, CELL_SIZE, px, py)
    ctx.globalAlpha = 1;
}

/* ========================= */
/* RESSOURCES SUR CONVOYEURS */
/* ========================= */
function drawResources(ctx: CanvasRenderingContext2D, world: World) {
    const resourceColors: Record<ResourcesType, string> = {
        iron: colors.resource.iron,
        coal: colors.resource.coal,
        water: colors.resource.water
    }
    
    world.conveyors.forEach(c => {
        if (!c.carrying) return;
        const { type, amount, progress = 0 } = c.carrying;
        
        // Position de base au centre de la case
        const path = buildConveyorPath(world, c, CELL_SIZE);
        const pos = interpolateOnConveyor(path, progress)
        
        // Dessin de la ressource
        ctx.fillStyle = resourceColors[type];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

function getIncomingDirection(
  prev: Conveyor,
  curr: Conveyor
): DirectionType {
    if (prev.x < curr.x) return "right";
    if (prev.x > curr.x) return "left";
    if (prev.y < curr.y) return "down";
    return "up";
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