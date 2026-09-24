import {it, expect, vi} from "vitest";
import {findPreviousConveyor, interpolatedConveyorProgress, pollutionHazeOpacity, render} from "./CanvasRenderer";
import type {Conveyor, DirectionType, WorldSnapshot} from "@engine/api/types";
import {assetManager} from "@web/render/manager/AssetManager";
import {createTestCampaign} from "@engine/test/createTestWorld";

vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: vi.fn((key: string) => ({width: 192, key}))}}));

it("progressively obscures the world as pollution approaches its limit", () => {
  expect(pollutionHazeOpacity(90, 900)).toBe(0);
  expect(pollutionHazeOpacity(450, 900)).toBeGreaterThan(0.15);
  expect(pollutionHazeOpacity(900, 900)).toBeCloseTo(0.52);
});

it("interpolates conveyor movement between simulation ticks without overshooting", () => {
  expect(interpolatedConveyorProgress(0.2, 0.2, 0)).toBeCloseTo(0.2);
  expect(interpolatedConveyorProgress(0.2, 0.2, 0.5)).toBeCloseTo(0.3);
  expect(interpolatedConveyorProgress(0.9, 0.2, 1)).toBe(1);
  expect(interpolatedConveyorProgress(0.2, 0.2, 4)).toBeCloseTo(0.4);
});

it("keeps queued resources still when the belt ahead is blocked", () => {
  const leading = interpolatedConveyorProgress(1, 0.2, 0.75);
  const blocked = interpolatedConveyorProgress(0.65, 0.2, 0.75, leading);
  expect(leading).toBe(1);
  expect(blocked).toBeCloseTo(0.65);

  const movingAhead = interpolatedConveyorProgress(0.6, 0.2, 0.5);
  const following = interpolatedConveyorProgress(0.25, 0.2, 0.5, movingAhead);
  expect(movingAhead).toBeCloseTo(0.7);
  expect(following).toBeCloseTo(0.35);
});

it("cuts eco miner animation into 32 pixel frames and centers it on its cell", () => {
  const world: WorldSnapshot = {
    tick: 4,
    machines: [{id: "eco-miner", x: 0, y: 0, type: "iron-mine", entityType: "machine", spriteName: "miner1",
      progress: 1, active: true, buffer: {}, capacity: 100, efficiency: 0.6, production: 1, variant: "eco"}],
    storages: [], tunnels: [], conveyors: [], campaign: createTestCampaign(),
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 1, height: 1, resources: [], tiles: [[{biome: "sea", variant: 0}]]}
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 32, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const machineDraw = drawImage.mock.calls.find(([image]) => image.key === "machine.miner.miner1.running");
  expect(machineDraw).toEqual([expect.anything(), 32, 0, 32, 48, 0, -8, 32, 48]);
});

it("cuts the running boiler into two complete 64 pixel frames", () => {
  const world: WorldSnapshot = {
    tick: 4,
    machines: [{id: "boiler", x: 1, y: 1, type: "boiler", entityType: "machine", spriteName: "boiler",
      progress: 1, active: true, buffer: {water: 1}, capacity: 100, efficiency: 1, production: 1, variant: "standard",
      recipeId: "water-purification"}],
    storages: [], tunnels: [], conveyors: [], campaign: createTestCampaign(),
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 3, height: 3, resources: [], tiles: Array.from({length: 3}, () =>
      Array.from({length: 3}, () => ({biome: "sea" as const, variant: 0})))}
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 96, height: 96}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const machineDraw = drawImage.mock.calls.find(([image]) => image.key === "machine.automation.boiler.running");
  expect(machineDraw).toEqual([expect.anything(), 64, 0, 64, 48, 16, 16, 64, 48]);
});
it("uses indexed predecessors for both resources and sprites, including disconnected belts", () => {
  const world: WorldSnapshot = {
    tick: 1, machines: [], storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
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
    tick: 0, machines: [], storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
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
    tick: 0, machines: [], storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 5, height: 1, resources: [], tiles: [Array.from({length: 5}, () => ({biome: "sea", variant: 0}))]},
    conveyors: [belt(0, "right"), belt(1, "left"), belt(3, "right", "splitter"), belt(4, "left")]
  };
  const ctx = {canvas: {width: 160, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn()} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const beltSprites = vi.mocked(assetManager.getImage).mock.calls.map(([key]) => key).filter(key => key.startsWith("conveyor."));
  expect(beltSprites).toEqual(["conveyor.right", "conveyor.left", "conveyor.left"]);
  expect(world.conveyors.map(conveyor => findPreviousConveyor(world, conveyor))).toEqual([undefined, undefined, undefined, undefined]);
});
