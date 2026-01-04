import {config} from "@web/config/gridConfig.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";

let conveyorSpriteSheet: HTMLImageElement | null = null;
export const SPRITE_SIZE = config.CELL_SIZE;

export function loadConveyorSpriteSheet() {
  conveyorSpriteSheet = new Image();
  conveyorSpriteSheet.src = "/apps/web/src/assets/logistic/conveyor/conveyor/conveyors.png";
}

export function getConveyorSpriteCoords(incoming: DirectionType, outgoing: DirectionType) {
  //lignes droites
  if (incoming === outgoing) {
    if (incoming === "left") return {sx: 5, sy: 0}
    if (incoming === "right") return {sx: 0, sy: 0}
    if (incoming === "up") return {sx: 3, sy: 1}
    if (incoming === "down") return {sx: 0, sy: 1}
  }
  // virages
  if (incoming === "left" && outgoing === "up") return {sy: 5, sx: 0}
  if (incoming === "left" && outgoing === "down") return {sy: 6, sx: 8}
  if (incoming === "down" && outgoing === "left") return {sy: 5, sx: 8}
  if (incoming === "down" && outgoing === "right") return {sy: 5, sx: 2}
  if (incoming === "right" && outgoing === "up") return {sx: 0, sy: 6}
  if (incoming === "right" && outgoing === "down") return {sx:3, sy: 7}
  if (incoming === "up" && outgoing === "right") return {sy: 6, sx: 4}
  if (incoming === "up" && outgoing === "left") return {sy: 7, sx: 6}
  return {sx: 0, sy: 0};
}

export function drawConveyor(ctx: CanvasRenderingContext2D,sx: number, sy: number, tileSize: number, px: number, py: number) {
  if(!conveyorSpriteSheet) return;
  ctx.drawImage(
    conveyorSpriteSheet,
    sx * SPRITE_SIZE, sy * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE,
    px, py,
    tileSize, tileSize
  )
}