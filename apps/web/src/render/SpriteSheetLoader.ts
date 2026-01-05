import {config} from "@web/config/gridConfig.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import {imagePath} from "@web/config/assetsConfig.ts";
import {conveyorAssetManager} from "@web/render/ConveyorAssetManager.ts";
import type {SpriteKey} from "@web/render/ConveyorAssetManager.ts";

export const SPRITE_SIZE = config.CELL_SIZE;

type SpriteDirectionType = DirectionType | `${DirectionType}-${DirectionType}`
type SpriteSheetCollectionType = Record<SpriteDirectionType, HTMLImageElement>

let SpriteSheetCollection: SpriteSheetCollectionType | null = null
export function loadConveyorSpriteSheet(): Promise<SpriteSheetCollectionType> {
  if (SpriteSheetCollection) {
    return Promise.resolve(SpriteSheetCollection)
  }
  const entries = Object.entries(imagePath.conveyor) as [SpriteDirectionType, string][]
  const promises = entries.map(([key, src]) => {
    return new Promise<[SpriteDirectionType, HTMLImageElement]>((resolve,reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve([key, img]);
      img.onerror = () => reject(`Failed to load conveyor sprite : ${src}`);
    });
  });
  
  return Promise.all(promises).then(results => {
    SpriteSheetCollection = Object.fromEntries(results) as SpriteSheetCollectionType
    return SpriteSheetCollection;
  })
}

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
  const spriteSheet = conveyorAssetManager.getImage(direction as SpriteKey);
  console.log(spriteSheet);
  ctx.drawImage(
    spriteSheet,
    sx * SPRITE_SIZE, sy * SPRITE_SIZE,
    SPRITE_SIZE, SPRITE_SIZE,
    px, py,
    tileSize, tileSize
  )
}