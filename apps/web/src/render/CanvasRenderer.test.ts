import {it, expect, vi} from "vitest";
import {findPreviousConveyor, render} from "./CanvasRenderer";
import type {Conveyor, DirectionType, WorldSnapshot} from "@engine/api/types";
import {assetManager} from "@web/render/manager/AssetManager";

vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: vi.fn(() => ({width: 192}))}}));
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

it("draws belts facing each other or a router output as straight belts", () => {
  // Aucun sprite de demi-tour n'existe : les demander faisait échouer tout le rendu.
  const belt = (x: number, direction: DirectionType, type: Conveyor["type"] = "conveyor"): Conveyor => ({
    id: String(x), x, y: 0, direction, type, entityType: "conveyor", speed: 0.2, capacity: 3, carrying: []
  });
  const world: WorldSnapshot = {
    tick: 0, machines: [], storages: [], resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 5, height: 1, resources: [], tiles: [Array.from({length: 5}, () => ({biome: "sea", variant: 0}))]},
    conveyors: [belt(0, "right"), belt(1, "left"), belt(3, "right", "splitter"), belt(4, "left")]
  };
  const ctx = {canvas: {width: 160, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn()} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const beltSprites = vi.mocked(assetManager.getImage).mock.calls.map(([key]) => key).filter(key => key.startsWith("conveyor."));
  expect(beltSprites).toEqual(["conveyor.right", "conveyor.left", "conveyor.left"]);
  expect(world.conveyors.map(conveyor => findPreviousConveyor(world, conveyor))).toEqual([undefined, undefined, undefined, undefined]);
});
