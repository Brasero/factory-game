
import {TILESET} from "@web/config/tileset.registry.ts";
import {TILE_SIZE} from "@engine/models/Tile.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import type {TileMap} from "@engine/world/TileMap.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;

export function drawTileMap(
  ctx: CanvasRenderingContext2D,
  tileMap: TileMap
) {
  const tileset = assetManager.getImage("tileset.environment")
  if (!tileMap) return
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.get(x, y);
      if (!tile) continue
      const biomeDef = TILESET[tile.biome]
      if (!biomeDef) continue
      const base =
        biomeDef.base[tile.variant % biomeDef.base.length]
      
      drawTile(ctx,{
        tileset,
        tileX: base.x,
        tileY: base.y,
        gridX: x,
        gridY: y,
        }
      )
      
      if (tile.decoration !== undefined && biomeDef.deco) {
        const deco =
          biomeDef.deco[tile.decoration % biomeDef.deco.length]
        
        drawTile(ctx,{
          tileset,
          tileX: deco.x,
          tileY: deco.y,
          gridX: x,
          gridY: y,
        })
      }
    }
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  {
    tileset, tileX, tileY, gridX, gridY
  }: {tileset: HTMLImageElement, tileX: number, tileY: number, gridX: number, gridY: number}
) {
  ctx.drawImage(
    tileset,
    tileX * TILE_SIZE,
    tileY * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    gridX * CELL_SIZE,
    gridY * CELL_SIZE,
    CELL_SIZE,
    CELL_SIZE
  )
}