
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
    gridX * CELL_SIZE,
    gridY * CELL_SIZE,
    CELL_SIZE,
    CELL_SIZE
  );
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