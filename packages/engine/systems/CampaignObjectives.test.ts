import {describe, expect, it} from "vitest";
import {createTestWorld} from "@engine/test/createTestWorld";
import {advanceObjective, runCampaign} from "./CampaignSystem";
import type {LevelProgress, ObjectiveProgress} from "@engine/models/Campaign";
import {GameEngine} from "@engine/core/GameEngine";
import {serializeWorld, restoreWorld} from "@engine/api/saveGame";

const state = (): ObjectiveProgress => ({value: 0, sustained: 0, baseline: {}, emissions: 0, attempts: 0});

describe("Campaign objectives", () => {
  it("requires every product in a composed delivery", () => {
    const level: LevelProgress = {id: "level-5", status: "active", pollution: 0, exports: {processingUnit: 18, circuit: 6, steel: 5}};
    const objective = {type: "export" as const, resource: "processingUnit" as const, amount: 18, requirements: {processingUnit: 18, circuit: 6, steel: 6}};
    const progress = state();
    expect(advanceObjective(objective, progress, level)).toBe(false);
    level.exports!.steel = 6;
    expect(advanceObjective(objective, progress, level)).toBe(true);
  });

  it("measures raw emissions and allows a new attempt without losing the campaign", () => {
    const level: LevelProgress = {id: "level-4", status: "active", pollution: 101, exports: {uraniumCell: 5}};
    const progress = state(), objective = {type: "export" as const, resource: "uraniumCell" as const, amount: 5, emissionBudget: 100};
    expect(advanceObjective(objective, progress, level)).toBe(false);
    expect(progress.attempts).toBe(1);
    expect(progress.value).toBe(0);
    level.exports!.uraniumCell = 10;
    level.pollution = 150;
    expect(advanceObjective(objective, progress, level)).toBe(true);
  });

  it("suspends a sustained-rate effort on interruption and never counts twice in one tick", () => {
    let world = createTestWorld();
    world.campaign.levels.forEach((level, index) => {level.status = index === 1 ? "active" : "locked"; level.exports = {};});
    for (let tick = 0; tick < 200; tick++) {
      world.tick = tick;
      world.campaign.levels[1].exports!.steel = tick + 1;
      world = runCampaign(world);
    }
    const level = world.campaign.levels[1];
    expect(level.status).toBe("completed");
    expect(level.objectiveProgress?.sustained).toBe(100);
    const reward = world.campaign.constructionMaterials;
    world = runCampaign(world);
    expect(world.campaign.constructionMaterials).toBe(reward);
    const progress = state();
    const objective = {type: "export" as const, resource: "steel" as const, amount: 1, rate: {amount: 2, window: 100, duration: 3}};
    progress.sustained = 2;
    level.telemetry!.rates.steel = 0;
    expect(advanceObjective(objective, progress, level)).toBe(false);
    expect(progress.sustained).toBe(2);
    level.telemetry!.rates.steel = 2;
    expect(advanceObjective(objective, progress, level)).toBe(true);
  });

  it("awards optional challenges once, without unlocking the next island", () => {
    let world = createTestWorld();
    world.campaign.levels.slice(1).forEach(level => {level.status = "locked";});
    world.campaign.levels[0].exports = {ironPlate: 10};
    world = runCampaign(world);
    expect(world.campaign.levels[0].challenges?.propre.completedAt).toBe(0);
    expect(world.campaign.levels[1].status).toBe("locked");
    expect(world.campaign.constructionMaterials).toBe(165);
    world.tick++;
    expect(runCampaign(world).campaign.constructionMaterials).toBe(165);
  });

  it("keeps the boiler and recycler automatic, while fabrication machines require a choice", () => {
    for (const [type, recipe] of [["boiler", "water-purification"], ["recycler", "recycling"], ["iron-smelter", undefined], ["assembler", undefined]] as const) {
      const engine = new GameEngine(createTestWorld());
      expect(engine.placeMachine(0, 0, type)).toBe(true);
      expect(engine.getSnapshot().machines[0].recipeId).toBe(recipe);
    }
  });

  it("preserves partial challenges, rate windows and exact terrain through a save", () => {
    let world = createTestWorld();
    world.campaign.levels[1].exports = {steel: 5};
    world = runCampaign(world);
    const saved = serializeWorld(world), restored = restoreWorld(saved);
    expect(restored.campaign.levels[1]).toEqual(world.campaign.levels[1]);
    expect(restored.grid?.getTile(0, 0)).toEqual(world.grid?.getTile(0, 0));
    expect(restored.grid?.width).toBe(10);
    const before = restored.campaign.levels[1].objectiveProgress!.sustained;
    expect(runCampaign(restored).campaign.levels[1].objectiveProgress!.sustained).toBe(before);
  });

  it("migrates old progress without granting retroactive challenge rewards", () => {
    const save = serializeWorld(createTestWorld());
    delete save.terrain;
    save.campaign.statistics.exported.ironPlate = 20;
    for (const level of save.campaign.levels) {
      delete level.exports; delete level.telemetry; delete level.challenges; delete level.objectiveProgress;
    }
    const restored = restoreWorld(save);
    expect(restored.campaign.levels[0].exports?.ironPlate).toBe(20);
    expect(restored.campaign.levels[0].challenges?.propre.baseline.ironPlate).toBe(20);
    expect(runCampaign(restored).campaign.constructionMaterials).toBe(save.campaign.constructionMaterials);
    expect(restored.grid?.width).toBe(250);
  });

});
