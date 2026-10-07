import {it, expect, vi} from "vitest";
import {
  findPreviousConveyor,
  interpolatedConveyorProgress,
  pollutionSmokeLayerVisibility,
  pollutionSmokeMotion,
  pollutionSmokeState,
  render
} from "./CanvasRenderer";
import type {Conveyor, DirectionType, WorldSnapshot} from "@engine/api/types";
import {assetManager} from "@web/render/manager/AssetManager";
import {createTestCampaign} from "@engine/test/createTestWorld";
import {emptyResources} from "@engine/models/Resources";

vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: vi.fn((key: string) => ({
  width: 192, naturalWidth: 512, naturalHeight: 512, key
}))}}));

it("moves thicker pollution smoke from the viewport edges toward the center", () => {
  expect(pollutionSmokeState(90, 900)).toEqual({intensity: 0, reach: 0, opacity: 0});
  const medium = pollutionSmokeState(450, 900);
  const critical = pollutionSmokeState(900, 900);
  expect(medium.reach).toBeGreaterThan(0.2);
  expect(critical.reach).toBeCloseTo(0.48);
  expect(critical.opacity).toBeGreaterThan(medium.opacity);
});

it("fades pollution smoke layers in progressively", () => {
  expect(pollutionSmokeLayerVisibility(0.3, 1)).toBe(0);
  expect(pollutionSmokeLayerVisibility(0.5, 1)).toBeCloseTo(0.5);
  expect(pollutionSmokeLayerVisibility(0.7, 1)).toBe(1);
});

it("moves pollution smoke continuously between rendered frames", () => {
  const firstFrame = pollutionSmokeMotion(1_000, 0, 120);
  const nextFrame = pollutionSmokeMotion(1_016, 0, 120);
  expect(nextFrame.offset).toBeGreaterThan(firstFrame.offset);
  expect(nextFrame.offset - firstFrame.offset).toBeLessThan(0.1);
});

it("keeps smoke texture variants aligned when their movement loops", () => {
  const beforeLoop = pollutionSmokeMotion(35_550, 0, 120);
  const afterLoop = pollutionSmokeMotion(35_560, 0, 120);
  expect(beforeLoop.offset).toBeGreaterThan(119);
  expect(afterLoop.offset).toBeLessThan(1);
  expect(afterLoop.tileShift).toBe(beforeLoop.tileShift + 1);
});

it("draws reusable smoke texture frames around a polluted viewport", () => {
  const campaign = createTestCampaign();
  campaign.pollution = campaign.pollutionLimit;
  const world: WorldSnapshot = {
    tick: 10, machines: [], storages: [], tunnels: [], conveyors: [], campaign,
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 1, height: 1, resources: [], tiles: [[{biome: "sea", variant: 0}]]}
  };
  const drawImage = vi.fn();
  const addColorStop = vi.fn();
  const ctx = {
    canvas: {width: 320, height: 180}, setTransform: vi.fn(), clearRect: vi.fn(), translate: vi.fn(), scale: vi.fn(),
    save: vi.fn(), restore: vi.fn(), rotate: vi.fn(), drawImage, fillRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({addColorStop}))
  } as unknown as CanvasRenderingContext2D;

  render(ctx, world, undefined, undefined, undefined, undefined, 0.5, 1_000);

  expect(ctx.createRadialGradient).toHaveBeenCalledTimes(4);
  expect(drawImage.mock.calls.filter(([image]) => image.key === "effect.pollutionSmoke").length).toBeGreaterThan(8);
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
  expect(machineDraw).toEqual([expect.anything(), 64, 0, 64, 48, 32, 16, 64, 48]);
});

it("draws the two-cell advanced assembler from its four-frame animation", () => {
  const world: WorldSnapshot = {
    tick: 4,
    machines: [{id: "advanced", x: 1, y: 2, type: "advanced-assembler", entityType: "machine",
      spriteName: "advancedAssembler", progress: 1, active: true, buffer: {}, capacity: 100, efficiency: 1,
      production: 1, variant: "standard", recipeId: "automation-core"}],
    storages: [], tunnels: [], conveyors: [], campaign: createTestCampaign(),
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 4, height: 4, resources: [], tiles: Array.from({length: 4}, () =>
      Array.from({length: 4}, () => ({biome: "sea" as const, variant: 0})))}
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 128, height: 128}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;

  render(ctx, world);

  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.automation.advancedAssembler.running"))
    .toEqual([expect.anything(), 96, 0, 96, 80, 16, 16, 96, 80]);
});

it("cuts the active recycler into four complete animation frames", () => {
  const recycler = {
    id: "recycler", x: 1, y: 1, type: "recycler" as const, entityType: "machine" as const,
    spriteName: "recycler", progress: 1, active: true, buffer: {iron: 1}, capacity: 100,
    efficiency: 1, production: 1, variant: "standard" as const, recipeId: "recycling" as const
  };
  const world: WorldSnapshot = {
    tick: 0, machines: [recycler], storages: [], tunnels: [], conveyors: [], campaign: createTestCampaign(),
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 3, height: 3, resources: [], tiles: Array.from({length: 3}, () =>
      Array.from({length: 3}, () => ({biome: "sea" as const, variant: 0})))}
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 96, height: 96}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;

  render(ctx, world);
  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.automation.recycler.running"))
    .toEqual([expect.anything(), 0, 0, 48, 48, 24, 16, 48, 48]);

  drawImage.mockClear();
  world.tick = 4;
  render(ctx, world);
  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.automation.recycler.running"))
    .toEqual([expect.anything(), 48, 0, 48, 48, 24, 16, 48, 48]);

  drawImage.mockClear();
  world.machines[0].active = false;
  render(ctx, world);
  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.automation.recycler.idle"))
    .toEqual([expect.anything(), 0, 0, 48, 48, 24, 16, 48, 48]);
});

it("draws distinct oversized sprites for island input and output tunnels", () => {
  const world: WorldSnapshot = {
    tick: 0, machines: [], storages: [], conveyors: [], campaign: createTestCampaign(),
    resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    tunnels: [
      {id: "input", x: 1, y: 1, entityType: "tunnel", type: "input", levelId: "level-2",
        direction: "right", capacity: 200, stored: emptyResources()},
      {id: "output", x: 3, y: 1, entityType: "tunnel", type: "output", levelId: "level-2",
        direction: "right", capacity: 200, stored: emptyResources()}
    ],
    grid: {width: 5, height: 3, resources: [], tiles: Array.from({length: 3}, () =>
      Array.from({length: 5}, () => ({biome: "sea" as const, variant: 0})))}
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 160, height: 96}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;

  render(ctx, world);

  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.tunnel.input"))
    .toEqual([expect.anything(), 16, 0, 64, 64]);
  expect(drawImage.mock.calls.find(([image]) => image.key === "machine.tunnel.output"))
    .toEqual([expect.anything(), 80, 0, 64, 64]);
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
  expect(beltSprites).toEqual(["conveyor.tier1", "conveyor.tier1", "conveyor.tier1"]);
  expect(world.conveyors.map(conveyor => findPreviousConveyor(world, conveyor))).toEqual([undefined, undefined, undefined, undefined]);
});

it("selects the upgraded belt atlas and the animated directional cell", () => {
  const world: WorldSnapshot = {
    tick: 2, machines: [], storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 1, height: 1, resources: [], tiles: [[{biome: "sea", variant: 0}]]},
    conveyors: [{id: "upgraded", x: 0, y: 0, direction: "right", type: "conveyor", tier: 4,
      entityType: "conveyor", speed: 0.2, capacity: 3, carrying: []}]
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 32, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const beltDraw = drawImage.mock.calls.find(([image]) => image.key === "conveyor.tier4");
  expect(beltDraw).toEqual([expect.anything(), 96, 48, 16, 16, 0, 0, 32, 32]);
});

it("uses the start, middle and end sprites across a connected belt line", () => {
  const world: WorldSnapshot = {
    tick: 0, machines: [], storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 3, height: 1, resources: [], tiles: [[{biome: "sea", variant: 0}, {biome: "sea", variant: 0}, {biome: "sea", variant: 0}]]},
    conveyors: [0, 1, 2].map(x => ({id: String(x), x, y: 0, direction: "right" as const, type: "conveyor" as const,
      entityType: "conveyor" as const, speed: 0.2, capacity: 3, carrying: []}))
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 96, height: 32}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const beltDraws = drawImage.mock.calls.filter(([image]) => image.key === "conveyor.tier1");
  expect(beltDraws.map(([, sourceX]) => sourceX)).toEqual([0, 16, 32]);
});

it("curves the first belt away from a connected machine output", () => {
  const world: WorldSnapshot = {
    tick: 0, storages: [], tunnels: [], campaign: createTestCampaign(), resources: {iron: 0, coal: 0, water: 0, ironPlate: 0},
    grid: {width: 2, height: 2, resources: [], tiles: Array.from({length: 2}, () =>
      Array.from({length: 2}, () => ({biome: "sea" as const, variant: 0})))},
    machines: [{id: "smelter", x: 0, y: 0, type: "iron-smelter", entityType: "machine", spriteName: "ironSmelter",
      progress: 0, active: false, buffer: {}, capacity: 100, efficiency: 1, production: 1, variant: "standard", recipeId: "iron-smelting"}],
    conveyors: [{id: "belt", x: 0, y: 1, direction: "right", type: "conveyor", entityType: "conveyor",
      speed: 0.2, capacity: 3, carrying: []}]
  };
  const drawImage = vi.fn();
  const ctx = {canvas: {width: 64, height: 64}, setTransform: vi.fn(), clearRect: vi.fn(), drawImage,
    fillRect: vi.fn(), fillText: vi.fn(), measureText: vi.fn(() => ({width: 40}))} as unknown as CanvasRenderingContext2D;
  render(ctx, world);
  const beltDraw = drawImage.mock.calls.find(([image]) => image.key === "conveyor.tier1");
  expect(beltDraw).toEqual([expect.anything(), 32, 16, 16, 16, 0, 32, 32, 32]);
});
