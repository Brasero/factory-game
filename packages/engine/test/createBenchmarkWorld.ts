import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import type {World} from "@engine/models/World";
import type {TileData} from "@engine/models/Tile";
import {emptyResources} from "@engine/models/Resources";
import {createTestCampaign} from "./createTestWorld";

/** Fixed mixed scene: production rows, loaded belts, storage and scenery. */
export function createBenchmarkWorld(count: number): World {
  const tiles: TileData[][] = Array.from({length: 190}, (_, y) =>
    Array.from({length: 250}, (_, x) => ({biome: "grass", variant: 3,
      decoration: y % 4 === 2 && x % 7 === 0 ? {type: "tree", variant: 0} : undefined})));
  const grid = new Grid(250, 190, new TileMap(250, 190, tiles));
  const world: World = {tick: 0, grid, machines: [], conveyors: [], storages: [], tunnels: [], resources: emptyResources(), campaign: createTestCampaign()};
  for (let i = 0; i < count; i++) {
    const x = i % 200, y = Math.floor(i / 200) * 4 + 1;
    world.conveyors.push({id: `belt-${i}`, x, y, type: "conveyor", entityType: "conveyor",
      direction: "right", capacity: 3, speed: 0.2, carrying: [{type: "iron", amount: 1, progress: 0.5}]});
    grid.occupy({x, y});
  }
  for (let row = 0; row < Math.ceil(count / 200); row++) {
    const y = row * 4, resource = row % 2 ? "coal" : "iron";
    grid.setResource(0, y, resource);
    grid.occupy({x: 0, y});
    world.machines.push({id: `mine-${row}`, x: 0, y, type: resource === "iron" ? "iron-mine" : "coal-mine",
      spriteName: "miner2", entityType: "machine", progress: 0, active: true, buffer: {iron: 10, coal: 10, water: 0, ironPlate: 0},
      capacity: 100, efficiency: 1, production: 1});
    const x = Math.min(200, count - row * 200);
    grid.occupy({x, y: y + 1});
    world.storages.push({id: `storage-${row}`, x, y: y + 1, entityType: "storage", capacity: 1000, stored: {iron: 0, coal: 0, water: 0, ironPlate: 0}});
  }
  return world;
}
