import {afterEach, beforeEach, describe, it, expect, vi} from "vitest";
import {createTestWorld} from "@engine/test/createTestWorld";

// Keep the real session and engine; replace only terrain generation.
vi.mock("@engine/world/WorldFactory", () => ({createWorld: createTestWorld}));

describe("GameController", () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.useRealTimers(); });

  it.each([
    ["placeIronMine", 1], ["placeCoalMine", 2], ["placeWaterPump", 3]
  ] as const)("%s validates resource, occupancy and bounds", async (method, x) => {
    const controller = await import("./GameController");
    expect(controller[method](x, 1)).toBe(true);
    expect(controller[method](x, 1)).toBe(false);
    expect(controller[method](0, 0)).toBe(false);
    expect(controller[method](-1, 1)).toBe(false);
    expect(controller[method](10, 1)).toBe(false);
  });

  it("places the iron smelter on free buildable ground", async () => {
    const controller = await import("./GameController");
    expect(controller.placeIronSmelter(0, 0)).toBe(true);
    expect(controller.placeIronSmelter(0, 0)).toBe(false);
    expect(controller.placeIronSmelter(-1, 1)).toBe(false);
    expect(controller.placeIronSmelter(10, 1)).toBe(false);
  });

  it("places the generic miner on iron and coal only", async () => {
    const controller = await import("./GameController");
    const {getWorldSnapshot} = await import("./worldStore");
    for (const x of [1, 2]) {
      expect(controller.canPlaceAt(x, 1, "miner")).toBe(true);
      expect(controller.placeMiner(x, 1)).toBe(true);
      expect(controller.canPlaceAt(x, 1, "miner")).toBe(false);
      expect(controller.placeMiner(x, 1)).toBe(false);
    }
    for (const [x, y] of [[3, 1], [0, 0], [-1, 1], [10, 1]]) {
      expect(controller.canPlaceAt(x, y, "miner")).toBe(false);
      expect(controller.placeMiner(x, y)).toBe(false);
    }
    expect(getWorldSnapshot().machines.map(machine => machine.type)).toEqual(["iron-mine", "coal-mine"]);
  });

  it("runs one timer, allows editing while paused and resumes", async () => {
    vi.useFakeTimers();
    const controller = await import("./GameController");
    const {getWorldSnapshot} = await import("./worldStore");
    controller.startGame(); controller.startGame();
    vi.advanceTimersByTime(300);
    expect(getWorldSnapshot().tick).toBe(3);
    controller.pauseGame();
    controller.placeStorage(0, 0);
    vi.advanceTimersByTime(1000);
    expect(getWorldSnapshot().tick).toBe(3);
    expect(getWorldSnapshot().storages).toHaveLength(1);
    controller.startGame();
    vi.advanceTimersByTime(100);
    expect(getWorldSnapshot().tick).toBe(4);
    controller.pauseGame();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("publishes placement and destruction to the UI store", async () => {
    const controller = await import("./GameController");
    const {getWorldSnapshot} = await import("./worldStore");
    controller.placeIronMine(1, 1);
    const before = getWorldSnapshot();
    expect(before.machines).toHaveLength(1);
    controller.destroyEntity(1, 1);
    expect(getWorldSnapshot().machines).toHaveLength(0);
    expect(before.machines).toHaveLength(1);
    expect(controller.placeIronMine(1, 1)).toBe(true);
  });
});
