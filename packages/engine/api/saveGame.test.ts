import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {restoreWorld, serializeWorld} from "./saveGame";

describe("Campaign saves", () => {
  it("restores dynamic state on a freshly generated grid", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(1, 1, "iron-mine", "industrial");
    engine.placeConveyor(1, 2, "down");
    for (let tick = 0; tick < 10; tick++) engine.tick();
    const saved = serializeWorld(engine.getWorld());
    const restored = restoreWorld(saved);
    expect(restored.tick).toBe(10);
    expect(restored.machines[0]).toMatchObject({type: "iron-mine", variant: "industrial"});
    expect(restored.campaign.pollution).toBeGreaterThan(0);
    expect(restored.grid?.isOccupied({x: 1, y: 1})).toBe(true);
    expect(restored.grid?.isOccupied({x: 1, y: 2})).toBe(true);
  });

  it("migrates the former steel foundry to the shared foundry", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "iron-smelter");
    const saved = serializeWorld(engine.getWorld());
    saved.machines[0].type = "steel-smelter";
    saved.machines[0].recipeId = "steel-smelting";

    expect(restoreWorld(saved).machines[0]).toMatchObject({
      type: "iron-smelter", recipeId: "steel-smelting", spriteName: "ironSmelter"
    });
  });
});
