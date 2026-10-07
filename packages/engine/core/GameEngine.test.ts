import {beforeEach, describe, it, expect} from "vitest";
import {GameEngine} from "./GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";

describe("GameEngine", () => {
  let engine: GameEngine;
  beforeEach(() => { engine = new GameEngine(createTestWorld()); });

  it("owns an independent world and advances its clock", () => {
    const world = createTestWorld();
    const game = new GameEngine(world);
    expect(game.getWorld()).toEqual(world);
    expect(game.getWorld()).not.toBe(world);
    game.tick();
    game.tick();
    expect(game.getWorld().tick).toBe(2);
  });

  it("removes many entities in one batch and ignores duplicate positions", () => {
    expect(engine.placeConveyor(0, 0, "right")).toBe(true);
    expect(engine.placeConveyor(1, 0, "right")).toBe(true);
    expect(engine.placeStorage(2, 0)).toBe(true);

    expect(engine.destroyEntitiesAt([{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}])).toBe(true);
    expect(engine.getWorld()).toMatchObject({conveyors: [], storages: []});
    expect(engine.destroyEntitiesAt([{x: 0, y: 0}])).toBe(false);
  });

  it("charges construction materials and refunds 75 percent on destruction", () => {
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(150);
    expect(engine.placeStorage(0, 0)).toBe(true);
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(140);
    expect(engine.destroyEntityAt(0, 0)).toBe(true);
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(147);

    const world = engine.getWorld();
    world.campaign.constructionMaterials = 0;
    engine = new GameEngine(world);
    expect(engine.canPlaceMachine(0, 0, "storage")).toBe(false);
    expect(engine.placeStorage(0, 0)).toBe(false);
  });

  it.each([
    ["iron-mine", 1, "iron"], ["coal-mine", 2, "coal"], ["water-pump", 3, "water"]
  ] as const)("produces %s into its buffer after ten ticks", (type, x, resource) => {
    expect(engine.placeMachine(x, 1, type)).toBe(true);
    for (let i = 0; i < 9; i++) engine.tick();
    expect(engine.getWorld().machines[0].buffer[resource] ?? 0).toBe(0);
    engine.tick();
    expect(engine.getWorld().machines[0].buffer[resource]).toBe(1);
    expect(engine.getWorld().resources[resource]).toBe(0);
  });

  it("stops extraction when the buffer is full", () => {
    engine.placeMachine(1, 1, "iron-mine");
    const initial = engine.getWorld();
    initial.machines[0].buffer.iron = 100;
    engine = new GameEngine(initial);
    for (let i = 0; i < 20; i++) engine.tick();
    expect(engine.getWorld().machines[0].buffer.iron).toBe(100);
    expect(engine.getWorld().machines[0].active).toBe(false);
  });

  it("moves extracted iron through a belt to storage without losing resources", () => {
    engine.placeMachine(1, 1, "iron-mine");
    engine.placeConveyor(1, 2, "down");
    engine.placeStorage(1, 3);
    for (let i = 0; i < 100; i++) engine.tick();
    const world = engine.getWorld();
    const stored = world.storages[0].stored.iron ?? 0;
    const carried = world.conveyors[0].carrying.reduce((sum, item) => sum + item.amount, 0);
    expect(stored).toBeGreaterThan(0);
    expect(stored + carried + (world.machines[0].buffer.iron ?? 0)).toBe(10);
  });

  it("changes a machine recipe and clears incompatible input buffers", () => {
    engine.placeMachine(0, 0, "iron-smelter");
    const world = engine.getWorld();
    world.campaign.levels[1].status = "active";
    world.machines[0].recipeId = "steel-smelting";
    world.machines[0].buffer = {ironPlate: 4, coal: 3, steel: 2};
    engine = new GameEngine(world);

    expect(engine.selectMachineRecipe(world.machines[0].id, "iron-smelting")).toBe(true);
    expect(engine.getWorld().machines[0]).toMatchObject({
      recipeId: "iron-smelting",
      buffer: {ironPlate: 0, coal: 0, steel: 2},
      progress: 0,
      active: false
    });
    expect(engine.selectMachineRecipe(world.machines[0].id, "circuit-assembly")).toBe(false);
  });

  it("unlocks the steel recipe on the existing foundry with level two", () => {
    const lockedWorld = createTestWorld();
    lockedWorld.campaign.levels[1].status = "locked";
    engine = new GameEngine(lockedWorld);
    engine.placeMachine(0, 0, "iron-smelter");
    const machineId = engine.getWorld().machines[0].id;
    expect(engine.selectMachineRecipe(machineId, "steel-smelting")).toBe(false);
    const world = engine.getWorld();
    world.campaign.levels[1].status = "active";
    engine = new GameEngine(world);
    expect(engine.selectMachineRecipe(machineId, "steel-smelting")).toBe(true);
    expect(engine.getWorld().machines[0].recipeId).toBe("steel-smelting");
  });

  it("reserves the four-input recipe for the advanced assembler", () => {
    expect(engine.placeMachine(0, 0, "assembler")).toBe(true);
    expect(engine.placeMachine(3, 0, "advanced-assembler")).toBe(true);
    const [assembler, advanced] = engine.getWorld().machines;

    expect(engine.selectMachineRecipe(assembler.id, "automation-core")).toBe(false);
    expect(engine.selectMachineRecipe(advanced.id, "automation-core")).toBe(true);
  });

  it("pauses and resumes a machine after its island is finalized", () => {
    engine.placeMachine(1, 1, "iron-mine");
    const world = engine.getWorld();
    world.campaign.levels[0].status = "completed";
    engine = new GameEngine(world);
    expect(engine.finalizeLevel("level-1")).toBe(true);
    const machineId = engine.getWorld().machines[0].id;

    expect(engine.setMachinePaused(machineId, true)).toBe(true);
    for (let tick = 0; tick < 20; tick++) engine.tick();
    expect(engine.getWorld().machines[0]).toMatchObject({paused: true, active: false, progress: 0});
    expect(engine.getWorld().machines[0].buffer.iron ?? 0).toBe(0);

    expect(engine.setMachinePaused(machineId, false)).toBe(true);
    for (let tick = 0; tick < 10; tick++) engine.tick();
    expect(engine.getWorld().machines[0].buffer.iron).toBe(1);
  });

  it("resumes simulation in free-play mode after campaign victory", () => {
    const world = createTestWorld();
    world.campaign.status = "finished";
    engine = new GameEngine(world);
    const tick = engine.getWorld().tick;
    engine.tick();
    expect(engine.getWorld().tick).toBe(tick);
    expect(engine.continueCampaign()).toBe(true);
    engine.tick();
    expect(engine.getWorld().tick).toBe(tick + 1);
    expect(engine.continueCampaign()).toBe(false);
  });
});
