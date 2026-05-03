import {TILE_SIZE} from "@engine/api/constants.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import type {GridSnapshot} from "@engine/api/types.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;

/**
 * DRAW TILE MAP (only the base tiles)
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Grid} grid - The grid to draw
 */
export function drawTileMap(
  ctx: CanvasRenderingContext2D,
  grid: GridSnapshot
) {
  if (!grid) return;
  
  ctx.imageSmoothingEnabled = false;
  
  const tileset = assetManager.getImage("tileset.environment");
  const water = assetManager.getImage("tileset.water");
  const tilesPerRow = Math.floor(tileset.width / TILE_SIZE);
  
  const subSize = CELL_SIZE / 2;
  const subDraw = subSize;
  
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      // SEA BASE
      for (let i = 0; i < 4; i++) {
        const sx = i%2
        const sy = Math.floor(i / 2)
        drawTileByIndex(ctx, {
          tileset: water,
          index: 0,
          gridX: x,
          gridY: y,
          tilesPerRow: 1,
          destX: (x*CELL_SIZE) + (sx * subSize),
          destY: (y * CELL_SIZE) + ( sy * subSize ),
          destSize: subDraw
        });
      }
    }
  }
  
  
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.tiles[y][x];
      if (!tile) continue;
      
      if (tile.subTiles && tile.subTiles.length === 4) {
        for (let i = 0; i < 4; i++) {
          const sub = tile.subTiles[i];
          if (!sub?.baseVariant && sub?.baseVariant !== 0) continue;
          const sx = i % 2;
          const sy = Math.floor(i / 2);
          drawTileByIndex(ctx, {
            tileset,
            index: sub.baseVariant,
            gridX: x,
            gridY: y,
            tilesPerRow,
            destX: (x * CELL_SIZE) - 1 + (sx * subSize) + 2,
            destY: (y * CELL_SIZE) - 1 + (sy * subSize) + 2,
            destSize: subDraw
          });
        }
        continue;
      }
      
      if (!tile.baseVariant && tile.baseVariant !== 0) continue;
      drawTileByIndex(ctx, {
        tileset,
        index: tile.baseVariant,
        gridX: x,
        gridY: y,
        tilesPerRow
      });
    }
  }
  
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.tiles[y][x];
      if (!tile) continue;
      
      if (tile.subTiles && tile.subTiles.length === 4) {
        for (let i = 0; i < 4; i++) {
          const sub = tile.subTiles[i];
          if (!sub || sub.biome === "sea") continue;
          const sx = i % 2;
          const sy = Math.floor(i / 2);
          drawTileByIndex(ctx, {
            tileset,
            index: sub.variant,
            gridX: x,
            gridY: y,
            tilesPerRow,
            destX: x * CELL_SIZE + sx * subSize,
            destY: y * CELL_SIZE + sy * subSize,
            destSize: subDraw
          });
        }
        continue;
      }
      
      if (tile.biome === "sea") continue;
      
      // BIOME TILE
      // drawTileByIndex(ctx, {
      //   tileset,
      //   index: tile.variant,
      //   gridX: x,
      //   gridY: y,
      //   tilesPerRow
      // });
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
 * @param destX
 * @param destY
 * @param destSize
 */
function drawTileByIndex(
  ctx: CanvasRenderingContext2D,
  {
    tileset,
    index,
    gridX,
    gridY,
    tilesPerRow,
    destX,
    destY,
    destSize
  }: {
    tileset: HTMLImageElement;
    index: number;
    gridX: number;
    gridY: number;
    tilesPerRow: number;
    destX?: number;
    destY?: number;
    destSize?: number;
  }
) {
  const tileX = index % tilesPerRow;
  const tileY = Math.floor(index / tilesPerRow);
  const drawX = destX ?? (gridX * CELL_SIZE);
  const drawY = destY ?? (gridY * CELL_SIZE);
  const drawSize = destSize ?? CELL_SIZE;
  
  ctx.drawImage(
    tileset,
    tileX * TILE_SIZE,
    tileY * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    drawX,
    drawY,
    drawSize,
    drawSize
  );
}

/**
 * Draw decoration tiles (trees, rocks, etc.)
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Grid} grid - The grid to draw decorations from
 */
export function drawDecorationTiles(
  ctx: CanvasRenderingContext2D,
  grid: GridSnapshot
) {
  if (!grid) return;
  
  const trees = assetManager.getImage("tileset.trees");
  const rock = assetManager.getImage("tileset.rock");
  
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.tiles[y][x];
      if (!tile) continue;
      
      // SEA
      if (tile.biome === "sea") {
        continue;
      }
      // DECORATION
      if (tile.decoration !== undefined) {
        if (tile.decoration.type === "rock") {
          // Rock
          ctx.save();
          if (tile.decoration.variant === 1 || tile.decoration.variant === 3) {
            ctx.translate(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2
            );
            ctx.scale(-1, 1);
            ctx.translate(
              -(x * CELL_SIZE + CELL_SIZE / 2),
              -(y * CELL_SIZE + CELL_SIZE / 2)
            );
          }
          ctx.drawImage(
            rock,
            0, 0,
            16,
            16,
            x * CELL_SIZE + 8,
            y * CELL_SIZE + 8,
            16,
            16
          );
          ctx.restore();
          continue;
        }
        ctx.drawImage(
          trees,
          tile.decoration.variant * 32, 0,
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