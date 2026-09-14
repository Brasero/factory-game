import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import type {World} from "@engine/models/World";

// Small, fixed terrain: no procedural generation or shared state between tests.
export function createTestWorld(): World {
  const tiles = Array.from({length: 10}, () =>
    Array.from({length: 10}, () => ({biome: "grass" as const, variant: 0})));
  const grid = new Grid(10, 10, new TileMap(10, 10, tiles));
  grid.setResource(1, 1, "iron");
  grid.setResource(2, 1, "coal");
  grid.setResource(3, 1, "water");
  return {tick: 0, grid, machines: [], conveyors: [], storages: [],
    resources: {iron: 0, coal: 0, water: 0}};
}
