import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {runCampaign} from "./CampaignSystem";
import {runTunnels} from "./TunnelSystem";
import {runConveyors} from "./ConveyorSystem";
import {emptyResources} from "@engine/models/Resources";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {RECIPES} from "@engine/config/recipeConfig";

describe("Campaign progression", () => {
  it("chains three increasingly complex recipes across the new islands", () => {
    const advancedLevels = CAMPAIGN_LEVELS.slice(3);
    const recipeIds = advancedLevels.map(level => level.unlocks.recipes[0]);
    expect(recipeIds).toEqual(["uranium-cell", "processing-unit", "automation-core"]);
    expect(recipeIds.map(id => Object.keys(RECIPES[id].inputs).length)).toEqual([2, 3, 4]);
    expect(advancedLevels.map(level => level.objective.resource)).toEqual([
      "uraniumCell", "processingUnit", "automationCore"
    ]);
    expect(CAMPAIGN_LEVELS.slice(0, -1).map(level => level.tunnels.find(tunnel => tunnel.type === "output")?.linkedTunnelId))
      .toEqual(["level-2-input", "level-3-input", "level-4-input", "level-5-input", "level-6-input"]);
  });

  it("records pollution only when a machine completes production", () => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeMachine(1, 1, "iron-mine", "standard")).toBe(true);
    for (let tick = 0; tick < 9; tick++) engine.tick();
    expect(engine.getSnapshot().campaign.pollution).toBe(0);
    engine.tick();
    expect(engine.getSnapshot().campaign.pollution).toBeCloseTo(0.98);
    expect(engine.getSnapshot().campaign.statistics.extracted.iron).toBe(1);
  });

  it("makes industrial machines faster and more polluting", () => {
    const standard = new GameEngine(createTestWorld());
    const industrial = new GameEngine(createTestWorld());
    standard.placeMachine(1, 1, "iron-mine", "standard");
    industrial.placeMachine(1, 1, "iron-mine", "industrial");
    for (let tick = 0; tick < 10; tick++) { standard.tick(); industrial.tick(); }
    expect(industrial.getSnapshot().campaign.statistics.extracted.iron).toBeGreaterThan(
      standard.getSnapshot().campaign.statistics.extracted.iron
    );
    expect(industrial.getSnapshot().campaign.pollution).toBeGreaterThan(standard.getSnapshot().campaign.pollution);
  });

  it("lets an efficient factory recover while a standard factory keeps accumulating pollution", () => {
    const ecoWorld = createTestWorld();
    ecoWorld.campaign.pollution = 10;
    const standardWorld = createTestWorld();
    standardWorld.campaign.pollution = 10;
    const eco = new GameEngine(ecoWorld);
    const standard = new GameEngine(standardWorld);
    eco.placeMachine(1, 1, "iron-mine", "eco");
    standard.placeMachine(1, 1, "iron-mine", "standard");
    for (let tick = 0; tick < 100; tick++) { eco.tick(); standard.tick(); }
    expect(eco.getSnapshot().campaign.pollution).toBeLessThan(10);
    expect(standard.getSnapshot().campaign.pollution).toBeGreaterThan(10);
  });

  it("moves already exported tunnel contents without counting them twice", () => {
    const world = createTestWorld();
    world.campaign.statistics.exported.ironPlate = 3;
    world.tunnels = [
      {id: "out", x: 1, y: 1, entityType: "tunnel", type: "output", levelId: "level-1", linkedTunnelId: "in", direction: "right", capacity: 20, stored: {...emptyResources(), ironPlate: 3}},
      {id: "in", x: 5, y: 1, entityType: "tunnel", type: "input", levelId: "level-2", direction: "right", capacity: 20, stored: {...emptyResources(), coal: 20}}
    ];
    const moved = runTunnels(world);
    expect(moved.tunnels.map(tunnel => tunnel.stored.ironPlate)).toEqual([0, 3]);
    expect(moved.tunnels[1].stored.coal).toBe(20);
    expect(moved.campaign.statistics.exported.ironPlate).toBe(3);
    const stable = runTunnels(moved);
    expect(stable.campaign.statistics.exported.ironPlate).toBe(3);
  });

  it("stores up to 200 units of each resource in a tunnel", () => {
    const world = createTestWorld();
    world.tunnels = [
      {id: "out", x: 1, y: 1, entityType: "tunnel", type: "output", levelId: "level-1", direction: "right", capacity: 200,
        stored: {...emptyResources(), ironPlate: 199, coal: 200}}
    ];
    world.conveyors = [{id: "belt", x: 0, y: 1, entityType: "conveyor", type: "conveyor", direction: "right",
      speed: 0.2, capacity: 3, carrying: [{type: "ironPlate", amount: 3, progress: 1}]}];

    runConveyors(world);
    expect(world.tunnels[0].stored).toMatchObject({ironPlate: 200, coal: 200});
    expect(world.conveyors[0].carrying).toEqual([{type: "ironPlate", amount: 2, progress: 1}]);
    expect(world.campaign.statistics.exported.ironPlate).toBe(1);
  });

  it("completes an objective and unlocks the next island", () => {
    const world = createTestWorld();
    for (const level of world.campaign.levels.slice(1)) level.status = "locked";
    world.campaign.statistics.exported.ironPlate = 50;
    const next = runCampaign(world);
    expect(next.campaign.levels.map(level => level.status)).toEqual([
      "completed", "active", "locked", "locked", "locked", "locked"
    ]);
    expect(next.campaign.levels[0].completedAt).toBe(0);
    expect(next.campaign.constructionMaterials).toBe(world.campaign.constructionMaterials + 50);
  });

  it("locks finalized islands against structural edits", () => {
    const world = createTestWorld();
    world.campaign.levels[0].status = "completed";
    const engine = new GameEngine(world);
    expect(engine.placeStorage(0, 0)).toBe(true);
    expect(engine.finalizeLevel("level-1")).toBe(true);
    expect(engine.destroyEntityAt(0, 0)).toBe(false);
    expect(engine.placeStorage(0, 1)).toBe(false);
  });

  it("stops the simulation when the pollution limit is reached", () => {
    const world = createTestWorld();
    world.campaign.pollutionLimit = 1;
    const engine = new GameEngine(world);
    engine.placeMachine(1, 1, "iron-mine");
    for (let tick = 0; tick < 10; tick++) engine.tick();
    expect(engine.getSnapshot().campaign.status).toBe("game-over");
    const stoppedAt = engine.getSnapshot().tick;
    engine.tick();
    expect(engine.getSnapshot().tick).toBe(stoppedAt);
  });
});
