import {TILE_SIZE} from "@engine/models/Tile.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import type {TileMap} from "@engine/world/TileMap.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;

/**
 * DRAW TILE MAP (only the base tiles and decorations)
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {TileMap} tileMap - The tile map to draw
 */
export function drawTileMap(
  ctx: CanvasRenderingContext2D,
  tileMap: TileMap
) {
  if (!tileMap) return;
  
  const tileset = assetManager.getImage("tileset.environment");
  const water = assetManager.getImage("tileset.water");
  const trees = assetManager.getImage("tileset.trees");
  const tilesPerRow = Math.floor(tileset.width / TILE_SIZE);
  
  for (let y = 0; y < tileMap.height; y++) {
    for (let x = 0; x < tileMap.width; x++) {
      const tile = tileMap.get(x, y);
      if (!tile) continue;
      
      // 🌊 SEA
      if (tile.biome === "sea") {
        drawTileByIndex(ctx, {
          tileset: water,
          index: 0,
          gridX: x,
          gridY: y,
          tilesPerRow: 1
        });
        continue;
      }
      
      // 🌍 BIOME TILE
      drawTileByIndex(ctx, {
        tileset,
        index: tile.variant,
        gridX: x,
        gridY: y,
        tilesPerRow
      });
      
      // 🌲 DECORATION
      if (tile.decoration !== undefined) {
        ctx.drawImage(
          trees,
          tile.decoration * 32, 0,
          32,
          48,
          x * CELL_SIZE,
          y * CELL_SIZE - (48 - CELL_SIZE),
          CELL_SIZE,
          48
        );
      }
    }
  }
}

/* ============================================================
  DRAW BY TILE INDEX
============================================================ */
/**
 * Draw a tile from a tileset by its index
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {HTMLImageElement} tileset - The tileset image
 * @param {number} index - The index of the tile in the tileset
 * @param {number} gridX - The x position in the grid
 * @param {number} gridY - The y position in the grid
 * @param {number} tilesPerRow - The number of tiles per row in the tileset
 */
function drawTileByIndex(
  ctx: CanvasRenderingContext2D,
  {
    tileset,
    index,
    gridX,
    gridY,
    tilesPerRow
  }: {
    tileset: HTMLImageElement;
    index: number;
    gridX: number;
    gridY: number;
    tilesPerRow: number;
  }
) {
  const tileX = index % tilesPerRow;
  const tileY = Math.floor(index / tilesPerRow);
  
  ctx.drawImage(
    tileset,
    tileX * TILE_SIZE,
    tileY * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    (gridX * CELL_SIZE) - 1,
    (gridY * CELL_SIZE) - 1,
    CELL_SIZE + 2,
    CELL_SIZE + 2
  );
}