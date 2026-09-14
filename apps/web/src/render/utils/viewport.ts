import type {Position} from "@engine/api/types";

export interface ViewportBounds {minX: number; minY: number; maxX: number; maxY: number}

export function visibleCells(width: number, height: number, cellSize: number,
  camera: {x: number; y: number; scale: number}, columns: number, rows: number): ViewportBounds {
  // Two-cell margin covers trees and machines extending beyond their anchor tile.
  const clampX = (x: number) => Math.max(0, Math.min(columns, x));
  const clampY = (y: number) => Math.max(0, Math.min(rows, y));
  return {
    minX: clampX(Math.floor(-camera.x / camera.scale / cellSize) - 2),
    minY: clampY(Math.floor(-camera.y / camera.scale / cellSize) - 2),
    maxX: clampX(Math.ceil((width - camera.x) / camera.scale / cellSize) + 2),
    maxY: clampY(Math.ceil((height - camera.y) / camera.scale / cellSize) + 2)
  };
}

export function isVisible(pos: Position, bounds: ViewportBounds): boolean {
  return pos.x >= bounds.minX && pos.y >= bounds.minY && pos.x < bounds.maxX && pos.y < bounds.maxY;
}
