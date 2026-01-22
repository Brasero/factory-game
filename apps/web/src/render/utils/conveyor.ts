import type {DirectionType, Conveyor, WorldSnapshot} from "@engine/api/types.ts";
import {config, config as gridConfig} from "@web/config/gridConfig.ts";
import {config as conveyorConfig} from "@web/config/conveyorConfig.ts";
import {findPreviousConveyor} from "@web/render/CanvasRenderer.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;
export function drawPreviewConveyor(ctx: CanvasRenderingContext2D, conveyors: {x: number, y: number, direction: DirectionType}[]) {
  conveyors.forEach((c) => {
    const px = c.x * CELL_SIZE;
    const py = c.y * CELL_SIZE;
    const {sx, sy} = getConveyorSpriteCoords(c.direction, c.direction);
    ctx.globalAlpha = 0.5;
    drawConveyor(ctx, sx, sy, CELL_SIZE, px, py, c.direction)
    ctx.globalAlpha = 1;
  })
}

export function drawConveyors(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  return world.conveyors.forEach(async (c) => {
    const px = c.x * CELL_SIZE;
    const py = c.y * CELL_SIZE;

    const previousConveyor = findPreviousConveyor(world, c);
    const outgoing = c.direction
    const incoming = previousConveyor ? getIncomingDirection(previousConveyor, c) : outgoing;
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
  });
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
