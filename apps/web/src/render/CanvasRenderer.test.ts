import {it, expect, vi} from "vitest";
import {render} from "./CanvasRenderer";
import type {WorldSnapshot} from "@engine/api/types";

vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: () => ({width: 192})}}));
it("uses indexed predecessors for both resources and sprites, including disconnected belts", () => {
  const world: WorldSnapshot = {
    tick: 1, machines: [], storages: [], resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 10, height: 1, resources: [], tiles: [Array.from({length: 10}, () => ({biome: "sea", variant: 0}))]},
    conveyors: [0, 1, 5].map(x => ({id: String(x), x, y: 0, direction: "right", type: "conveyor", entityType: "conveyor",
      speed: 0.2, capacity: 3, carrying: [{type: "iron", amount: 1, progress: 0.5}]}))
  };
  const lookup = vi.spyOn(world.conveyors, "find");
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 320, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  expect(lookup).not.toHaveBeenCalled();
  expect(drawImage).toHaveBeenCalledTimes(40 + 3 + 3);
});

it("hides resources inside routers while retaining resources on ordinary belts", () => {
  const world: WorldSnapshot = {
    tick: 0, machines: [], storages: [], resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 3, height: 1, resources: [], tiles: [[{biome: "sea", variant: 0}, {biome: "sea", variant: 0}, {biome: "sea", variant: 0}]]},
    conveyors: (["conveyor", "merger", "splitter"] as const).map((type, x) => ({
      id: String(x), x, y: 0, direction: "right", type, entityType: "conveyor",
      speed: 0.2, capacity: 3, carrying: [{type: "iron", amount: 1, progress: 0.5}]
    }))
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 320, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  expect(drawImage).toHaveBeenCalledTimes(12 + 4); // Water, three entities, one visible resource.
});
