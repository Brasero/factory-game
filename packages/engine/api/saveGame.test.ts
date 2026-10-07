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

  it.each(["boiler", "advanced-assembler"] as const)("restores both occupied cells of a %s", type => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeMachine(5, 5, type)).toBe(true);

    const restored = restoreWorld(serializeWorld(engine.getWorld()));

    expect(restored.grid?.isOccupied({x: 5, y: 5})).toBe(true);
    expect(restored.grid?.isOccupied({x: 6, y: 5})).toBe(true);
    const restoredEngine = new GameEngine(restored);
    expect(restoredEngine.destroyEntityAt(6, 5)).toBe(true);
    expect(restoredEngine.getWorld().grid?.isOccupied({x: 5, y: 5})).toBe(false);
    expect(restoredEngine.getWorld().grid?.isOccupied({x: 6, y: 5})).toBe(false);
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

  it("migrates the former wire mill to the shared production machine", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "assembler");
    const saved = serializeWorld(engine.getWorld());
    saved.machines[0].type = "wire-mill";
    saved.machines[0].recipeId = "copper-wire";

    expect(restoreWorld(saved).machines[0]).toMatchObject({
      type: "assembler", recipeId: "copper-wire", spriteName: "assembler"
    });
  });

  it("unlocks the campaign expansion after restoring a completed three-island save", () => {
    const save = serializeWorld(new GameEngine(createTestWorld()).getWorld());
    save.campaign.levels = save.campaign.levels.slice(0, 3).map(level => ({...level, status: "finalized"}));
    save.campaign.activeLevelId = "level-3";
    save.campaign.status = "finished";
    save.resources = {iron: 0, coal: 0, water: 0, ironPlate: 0};

    const restored = restoreWorld(save);

    expect(restored.campaign.status).toBe("playing");
    expect(restored.campaign.activeLevelId).toBe("level-4");
    expect(restored.campaign.levels.map(level => level.status)).toEqual([
      "finalized", "finalized", "finalized", "active", "locked", "locked"
    ]);
    expect(restored.resources).toMatchObject({uranium: 0, uraniumCell: 0, processingUnit: 0, automationCore: 0});
  });

  it("preserves removed scenery", () => {
    const generated = restoreWorld(serializeWorld(new GameEngine(createTestWorld()).getWorld()));
    const decoration = {x: 12, y: 14};
    generated.grid!.replaceDecorations([{...decoration, type: "tree", variant: 1}]);
    generated.grid!.removeDecoration(decoration);
    const restored = restoreWorld(serializeWorld(generated));
    expect(restored.grid!.getTile(decoration.x, decoration.y)?.decoration).toBeUndefined();
  });

  it("restores the complete saved decoration layout", () => {
    const generated = restoreWorld(serializeWorld(new GameEngine(createTestWorld()).getWorld()));
    generated.grid!.replaceDecorations([
      {x: 12, y: 14, type: "tree", variant: 2},
      {x: 20, y: 22, type: "rock", variant: 3}
    ]);
    const save = serializeWorld(generated);
    const restored = restoreWorld(save);
    expect(restored.grid!.getDecorations()).toEqual([
      {x: 12, y: 14, type: "tree", variant: 2},
      {x: 20, y: 22, type: "rock", variant: 3}
    ]);
  });
});
