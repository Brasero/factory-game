import {describe, it, expect, vi} from "vitest";
import {visibleCells} from "./viewport";
import {drawTileMap} from "./tiles";

vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: () => ({width: 192})}}));

describe("Visible terrain", () => {
  it("accounts for zoom, translation and sprite margins", () => {
    expect(visibleCells(320, 320, 32, {x: -320, y: -320, scale: 2}, 250, 190))
      .toEqual({minX: 3, minY: 3, maxX: 12, maxY: 12});
    expect(visibleCells(320, 320, 32, {x: 10000, y: 10000, scale: 1}, 250, 190))
      .toEqual({minX: 0, minY: 0, maxX: 0, maxY: 0});
  });
  it("draws only visible sea tiles, not the entire 47,500-cell map", () => {
    const tiles = Array.from({length: 190}, () => Array.from({length: 250}, () => ({biome: "sea" as const, variant: 0})));
    const drawImage = vi.fn();
    const ctx = {drawImage} as unknown as CanvasRenderingContext2D;
    const bounds = visibleCells(320, 320, 32, {x: 0, y: 0, scale: 1}, 250, 190);
    drawTileMap(ctx, {width: 250, height: 190, tiles, resources: []}, bounds);
    expect(drawImage).toHaveBeenCalledTimes(12 * 12 * 4);
  });
});
