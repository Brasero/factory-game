import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import type {World} from "@engine/models/World";
import {emptyResources} from "@engine/models/Resources";
import type {CampaignState} from "@engine/models/Campaign";

export const createTestCampaign = (): CampaignState => ({
  activeLevelId: "level-1", pollution: 0, pollutionLimit: 1000, status: "playing",
  levels: [
    {id: "level-1", status: "active", pollution: 0},
    {id: "level-2", status: "active", pollution: 0},
    {id: "level-3", status: "active", pollution: 0}
  ],
  statistics: {extracted: emptyResources(), produced: emptyResources(), exported: emptyResources()}
});

// Small, fixed terrain: no procedural generation or shared state between tests.
export function createTestWorld(): World {
  const tiles = Array.from({length: 10}, () =>
    Array.from({length: 10}, () => ({biome: "grass" as const, variant: 0})));
  const grid = new Grid(10, 10, new TileMap(10, 10, tiles));
  grid.setResource(1, 1, "iron");
  grid.setResource(2, 1, "coal");
  grid.setResource(3, 1, "water");
  return {tick: 0, grid, machines: [], conveyors: [], storages: [], tunnels: [],
    resources: emptyResources(), campaign: createTestCampaign()};
}
