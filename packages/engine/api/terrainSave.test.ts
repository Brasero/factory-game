import {expect, it} from "vitest";
import {packTerrain, unpackTerrain} from "./terrainSave";
import type {GridSnapshot} from "./types";

it("deduplicates subtiles and restores their exact variants after JSON serialization", () => {
  const tile = {biome: "sea" as const, variant: 2, baseVariant: 1,
    subTiles: [{biome: "grass" as const, variant: 3, baseVariant: 2}, {biome: "sea" as const, variant: 1}]};
  const grid: GridSnapshot = {width: 2, height: 1, tiles: [[tile, tile]], resources: []};
  const saved = packTerrain(grid);
  expect(saved.palette).toHaveLength(1);
  expect(saved.subTiles).toHaveLength(2);
  expect(saved.rows).toEqual([[0, 2]]);
  expect(unpackTerrain(JSON.parse(JSON.stringify(saved)))).toEqual(grid.tiles);
  expect(packTerrain(grid)).toBe(saved);
});

it("accepts the original terrain palette with inline subtiles", () => {
  const tile = {biome: "sea" as const, variant: 0, subTiles: [{biome: "grass" as const, variant: 1}]};
  expect(unpackTerrain({width: 1, height: 1, palette: [tile], rows: [[0, 1]], resources: [], decorations: []})).toEqual([[tile]]);
});
