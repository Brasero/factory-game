import {acceptsInput, nextPosition, outputDirections, positionKey} from "@engine/systems/NetworkTopology";
import type {DirectionType, Conveyor, WorldSnapshot} from "@engine/api/types.ts";
import {config, config as gridConfig} from "@web/config/gridConfig.ts";
import {config as conveyorConfig} from "@web/config/conveyorConfig.ts";
import {findPreviousConveyor} from "@web/render/CanvasRenderer.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;
export function drawPreviewConveyor(ctx: CanvasRenderingContext2D, conveyors: {x: number, y: number, direction: DirectionType; type?: Conveyor["type"]}[], world?: WorldSnapshot) {
  conveyors.forEach((c) => {
    const px = c.x * CELL_SIZE;
    const py = c.y * CELL_SIZE;
    const {sx, sy} = getConveyorSpriteCoords(c.direction, c.direction);
    ctx.globalAlpha = 0.5;
    if (c.type === "splitter" || c.type === "merger") {
      const preview: Conveyor = {...c, type: c.type, id: "preview", entityType: "conveyor", carrying: [], speed: 0, capacity: 3};
      const neighbors = world?.conveyors.filter(belt => belt.x !== c.x || belt.y !== c.y) ?? [];
      drawRouter(ctx, c.x, c.y, c.direction, c.type, 0, connectedRouterIds([...neighbors, preview]).has(preview.id));
    }
    else drawConveyor(ctx, sx, sy, CELL_SIZE, px, py, c.direction)
    ctx.globalAlpha = 1;
    if (c.type === "splitter" || c.type === "merger") drawRouterArrows(ctx, c.x, c.y, c.direction, c.type);
  })
}

export function drawConveyors(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  return world.conveyors.forEach(c => drawConveyorAt(ctx, world, c));
}

export function drawConveyorAt(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  conveyor: Conveyor,
  previous?: Conveyor | null,
  connected?: boolean
) {
  if (conveyor.type !== "conveyor") return drawRouter(ctx, conveyor.x, conveyor.y, conveyor.direction, conveyor.type, world.tick, connected ?? connectedRouterIds(world.conveyors).has(conveyor.id));
  const px = conveyor.x * CELL_SIZE;
  const py = conveyor.y * CELL_SIZE;

  const previousConveyor = previous === undefined ? findPreviousConveyor(world, conveyor) : previous;
  const outgoing = conveyor.direction
  const incoming = previousConveyor ? getIncomingDirection(previousConveyor, conveyor) : outgoing;
  const {sx, sy} = getConveyorSpriteCoords(incoming, outgoing)
  if ((outgoing  === incoming && incoming === "right") || (outgoing === "left" && outgoing === incoming)) {
    const offset = getBeltFrame(world.tick, conveyorConfig.H_FRAMES);
    return drawConveyor(ctx, sx + offset, sy, CELL_SIZE, px, py, outgoing)
  }
  if ((outgoing  === incoming && incoming === "up") || (outgoing === "down" && outgoing === incoming)) {
    const offset = getBeltFrame(world.tick, conveyorConfig.V_FRAMES);
    return drawConveyor(ctx, sx, sy + offset, CELL_SIZE, px, py, outgoing)
  }
  const offset = getBeltFrame(world.tick, conveyorConfig.H_FRAMES)
  const direction = `${incoming}-${outgoing}` as `${DirectionType}-${DirectionType}`;
  return drawConveyor(ctx, sx + offset, sy, CELL_SIZE, px, py, direction);
}



// HELPERS
export function getIncomingDirection(
    prev: Conveyor,
    curr: Conveyor
): DirectionType {
  if (prev.x < curr.x) return "right";
  if (prev.x > curr.x) return "left";
  if (prev.y < curr.y) return "down";
  return "up";
}

function getBeltFrame(tick: number, frameCount: number) {
  return (Math.floor(tick * conveyorConfig.BELT_ANIMATION_SPEED) % CELL_SIZE ) % frameCount;
}


export const SPRITE_SIZE = config.CELL_SIZE;

type SpriteDirectionType = DirectionType | `${DirectionType}-${DirectionType}`


export function getConveyorSpriteCoords(incoming: DirectionType, outgoing: DirectionType) {
  //lignes droites
  if (incoming === outgoing) {
    if (incoming === "left") return {sx: 0, sy: 0}
    if (incoming === "right") return {sx: 0, sy: 0}
    if (incoming === "up") return {sx: 0, sy: 0}
    if (incoming === "down") return {sx: 0, sy: 0}
  }
  // virages
  if (incoming === "left" && outgoing === "up") return {sx: 0, sy: 0}
  if (incoming === "left" && outgoing === "down") return {sx: 0, sy: 0}
  if (incoming === "down" && outgoing === "left") return {sx: 0, sy: 0}
  if (incoming === "down" && outgoing === "right") return {sx: 0, sy: 0}
  if (incoming === "right" && outgoing === "up") return {sx: 0, sy: 0}
  if (incoming === "right" && outgoing === "down") return {sx: 0, sy: 0}
  if (incoming === "up" && outgoing === "right") return {sx: 0, sy: 0}
  if (incoming === "up" && outgoing === "left") return {sx: 0, sy: 0}
  return {sx: 0, sy: 0};
}

export  function drawConveyor(ctx: CanvasRenderingContext2D,sx: number, sy: number, tileSize: number, px: number, py: number, direction: SpriteDirectionType | null = null) {
  const spriteSheet = assetManager.getImage(`conveyor.${direction}`);

  ctx.drawImage(
      spriteSheet,
      sx * SPRITE_SIZE, sy * SPRITE_SIZE,
      SPRITE_SIZE, SPRITE_SIZE,
      px, py,
      tileSize, tileSize
  )
}

export function connectedRouterIds(conveyors: Conveyor[]): Set<string> {
  const byPosition = new Map(conveyors.map(c => [positionKey(c), c]));
  const connected = new Set<string>();
  for (const source of conveyors) {
    for (const direction of outputDirections(source)) {
      const target = byPosition.get(positionKey(nextPosition(source, direction)));
      if (!target || !acceptsInput(target, source)) continue;
      connected.add(source.id);
      connected.add(target.id);
    }
  }
  return connected;
}

export function drawRouter(ctx: CanvasRenderingContext2D, x: number, y: number,
  direction: DirectionType, type: "splitter" | "merger", tick = 0, connected = false) {
  // Chaque orientation a une ligne jaune (8 frames), puis rouge (4 frames).
  const rows = type === "splitter"
    ? {down: 0, up: 2, left: 4, right: 6}
    : {down: 0, up: 2, right: 4, left: 6};
  const row = rows[direction] + (connected ? 0 : 1);
  const frame = Math.floor(tick / 2) % (connected ? 8 : 4);
  ctx.drawImage(assetManager.getImage(`router.${type}`), frame * 64, row * 64, 64, 64,
    x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

/** Placement only: input arrows point inward, output arrows point outward. */
export function drawRouterArrows(ctx: CanvasRenderingContext2D, x: number, y: number,
  direction: DirectionType, type: "splitter" | "merger") {
  const vectors = {up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0]} as const;
  const [forwardX, forwardY] = vectors[direction];
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0e111b";
  for (const [dx, dy] of Object.values(vectors)) {
    const isForward = dx === forwardX && dy === forwardY;
    const isRear = dx === -forwardX && dy === -forwardY;
    const input = type === "splitter" ? isRear : !isForward;
    const sign = input ? -1 : 1;
    ctx.save();
    ctx.translate((x + 0.5) * CELL_SIZE + dx * (CELL_SIZE / 2 + 9),
      (y + 0.5) * CELL_SIZE + dy * (CELL_SIZE / 2 + 9));
    ctx.rotate(Math.atan2(dy * sign, dx * sign));
    ctx.fillStyle = input ? "#65dfff" : "#ffd166";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(0, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(-7, -3);
    ctx.lineTo(-7, 3);
    ctx.lineTo(0, 3);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
