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
