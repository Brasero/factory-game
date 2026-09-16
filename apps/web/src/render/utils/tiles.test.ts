import {afterEach, expect, it, vi} from "vitest";
import {drawTileMap} from "./tiles";
import {assetManager} from "../manager/AssetManager";
import type {GridSnapshot} from "@engine/api/types";

vi.mock("../manager/AssetManager", () => ({assetManager: {getImage: vi.fn()}}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("reuses a bounded water pattern, replaces changed assets, and preserves fractional rendering", () => {
  const sourceDraw = vi.fn();
  vi.stubGlobal("OffscreenCanvas", class {
    width: number; height: number;
    constructor(width: number, height: number) { this.width = width; this.height = height; }
    getContext() { return {drawImage: sourceDraw}; }
  });
  vi.mocked(assetManager.getImage).mockReturnValue({width: 192} as HTMLImageElement);
  const transform = {a: 0.5, d: 0.5, b: 0, c: 0, e: -32, f: 16};
  const createPattern = vi.fn(() => ({})), fillRect = vi.fn(), drawImage = vi.fn();
  const ctx = {getTransform: () => transform, createPattern, fillRect, drawImage, fillStyle: "red"} as unknown as CanvasRenderingContext2D;
  const grid: GridSnapshot = {width: 2, height: 2, resources: [],
    tiles: Array.from({length: 2}, () => Array.from({length: 2}, () => ({biome: "sea", variant: 0})))};
  drawTileMap(ctx, grid); drawTileMap(ctx, grid);
  expect(createPattern).toHaveBeenCalledTimes(1);
  expect(sourceDraw).toHaveBeenCalledTimes(1);
  expect(fillRect).toHaveBeenLastCalledWith(0, 0, 64, 64);
  expect(ctx.fillStyle).toBe("red");
  expect(drawImage).not.toHaveBeenCalled();
  vi.mocked(assetManager.getImage).mockReturnValue({width: 256} as HTMLImageElement);
  drawTileMap(ctx, grid);
  expect(createPattern).toHaveBeenCalledTimes(2);
  transform.e = -32.5;
  drawTileMap(ctx, grid);
  expect(drawImage).toHaveBeenCalledTimes(16);
  expect(drawImage).toHaveBeenLastCalledWith(
    expect.anything(), 0, 0, 16, 16, 47.5, 47.5, 17, 17
  );
  transform.e = 0; transform.a = transform.d = 0.75;
  drawTileMap(ctx, grid);
  expect(drawImage).toHaveBeenCalledTimes(32);
});

it.each([49, 58, 59, 70, 71])("draws shore variant %s even when its parent is sea", (variant) => {
  vi.mocked(assetManager.getImage).mockReturnValue({width: 192} as HTMLImageElement);
  const drawImage = vi.fn();
  const ctx = {drawImage, imageSmoothingEnabled: true} as unknown as CanvasRenderingContext2D;
  const grid: GridSnapshot = {width: 1, height: 1, resources: [], tiles: [[{
    biome: "sea",
    variant: 0,
    subTiles: [
      {biome: "grass-shore", variant, baseVariant: 34},
      {biome: "sea", variant: 0},
      {biome: "sea", variant: 0},
      {biome: "sea", variant: 0}
    ]
  }]]};

  drawTileMap(ctx, grid);

  expect(drawImage).toHaveBeenCalledTimes(5);
  expect(drawImage.mock.calls.at(-1)).toEqual([
    expect.anything(), (variant % 12) * 16, Math.floor(variant / 12) * 16, 16, 16, 0, 0, 16, 16
  ]);
});
