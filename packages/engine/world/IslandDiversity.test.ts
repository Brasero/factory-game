import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {createWorld} from "./WorldFactory";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {levels} from "@engine/config/LevelConfig";

beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0.5); });
afterEach(() => { vi.restoreAllMocks(); });

it("varies island areas while preserving accessible deposits and tunnel connections", () => {
  const world = createWorld();
  const grid = world.grid!;
  const areas = CAMPAIGN_LEVELS.map(level => {
    let area = 0;
    for (let y = level.center.y - 28; y <= level.center.y + 28; y++) for (let x = level.center.x - 28; x <= level.center.x + 28; x++) {
      if (grid.getTile(x, y)?.biome !== "sea") area++;
    }
    for (let x = level.center.x - 17; x <= level.center.x + 17; x++) {
      expect(grid.canPlaceMachine({x, y: level.center.y}, "conveyor")).toBe(true);
    }
    return area;
  });
  expect(new Set(areas).size).toBeGreaterThanOrEqual(4);
  for (const node of grid.getResourceMap()) {
    const type = node.resource === "water" ? "water-pump" : "miner";
    expect(grid.canPlaceMachine(node.pos, type)).toBe(true);
    expect(grid.getTile(node.pos.x + 1, node.pos.y)?.biome).not.toBe("sea");
  }
  expect(new Set(levels.map(level => level.islands[0].shape.size)).size).toBeGreaterThan(2);
});

it("stores the exact archipelago in a compact save that survives regeneration", async () => {
  const {serializeWorld, restoreWorld} = await import("@engine/api/saveGame");
  const world = createWorld(), save = serializeWorld(world);
  expect(JSON.stringify(save).length).toBeLessThan(2_000_000);
  const restored = restoreWorld(save);
  for (const level of CAMPAIGN_LEVELS) {
    for (const offset of [-18, -9, 0, 9, 18]) {
      expect(restored.grid!.getTile(level.center.x + offset, level.center.y + 8))
        .toEqual(world.grid!.getTile(level.center.x + offset, level.center.y + 8));
    }
  }
  expect(restored.grid!.getResourceMap()).toEqual(world.grid!.getResourceMap());
});
