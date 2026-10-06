import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import type {Machine} from "@engine/models/Machine";
import type {World} from "@engine/models/World";
import {runProduction} from "./ProductionSystem";
import type {ResourcesType} from "@engine/models/Resources";

function smelterWorld(buffer: Partial<Machine["buffer"]>): World {
  const engine = new GameEngine(createTestWorld());
  engine.placeMachine(5, 5, "iron-smelter");
  const world = engine.getWorld();
  world.machines[0].recipeId = "iron-smelting";
  world.machines[0].buffer = {...buffer} as Machine["buffer"];
  return world;
}
function run(world: World, ticks: number): World {
  for (let i = 0; i < ticks; i++) world = runProduction(world);
  return world;
}

describe("Recipe production", () => {
  it("waits idle without ingredient instead of cooking in advance", () => {
    const world = run(smelterWorld({}), 40);
    expect(world.machines[0]).toMatchObject({active: false, progress: 0});
  });

  it("takes the full recipe duration for the first plate after an idle period", () => {
    let world = run(smelterWorld({}), 40);
    world.machines[0].buffer.iron = 1;
    world = run(world, 19);
    expect(world.machines[0].buffer.ironPlate ?? 0).toBe(0);
    expect(world.machines[0].active).toBe(true);
    world = run(world, 1);
    expect(world.machines[0].buffer).toEqual({iron: 0, ironPlate: 1});
  });

  it("keeps smelting a buffer filled with ingredients", () => {
    const world = run(smelterWorld({iron: 100}), 20);
    expect(world.machines[0].buffer).toEqual({iron: 99, ironPlate: 1});
  });

  it("pauses without losing progress while its output is full", () => {
    let world = run(smelterWorld({iron: 2}), 10);
    world.machines[0].buffer.ironPlate = 100;
    world = run(world, 30);
    expect(world.machines[0]).toMatchObject({active: false, progress: 10});
    world.machines[0].buffer.ironPlate = 0;
    world = run(world, 10);
    expect(world.machines[0].buffer).toEqual({iron: 1, ironPlate: 1});
  });

  it("produces wire and circuits with the same production machine", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "assembler");
    let world = engine.getWorld();
    world.machines[0].recipeId = "copper-wire";
    world.machines[0].buffer = {copper: 1};
    world = run(world, 18);
    expect(world.machines[0].buffer).toMatchObject({copper: 0, copperWire: 2});

    world.machines[0].recipeId = "circuit-assembly";
    world.machines[0].progress = 0;
    world.machines[0].buffer = {ironPlate: 1, copperWire: 2};
    world = run(world, 35);
    expect(world.machines[0].buffer).toMatchObject({ironPlate: 0, copperWire: 0, circuit: 1});
  });

  it("consumes one unit of water to reduce pollution", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "boiler");
    let world = engine.getWorld();
    world.machines[0].recipeId = "water-purification";
    world.machines[0].buffer = {water: 1};
    world.campaign.pollution = 50;

    world = run(world, 29);
    expect(world.machines[0]).toMatchObject({active: true, progress: 29, buffer: {water: 1}});
    world = run(world, 1);

    expect(world.machines[0]).toMatchObject({active: true, progress: 0, buffer: {water: 0}});
    expect(world.campaign.pollution).toBeCloseTo(45.4);
  });

  it("does not let one standard boiler neutralize a standard production chain", () => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeMachine(0, 0, "boiler")).toBe(true);
    expect(engine.placeMachine(5, 5, "iron-smelter")).toBe(true);
    expect(engine.placeMachine(6, 5, "iron-smelter")).toBe(true);
    let world = engine.getWorld();
    const boiler = world.machines.find(machine => machine.type === "boiler")!;
    boiler.recipeId = "water-purification";
    boiler.buffer = {water: 100};
    for (const smelter of world.machines.filter(machine => machine.type === "iron-smelter")) {
      smelter.recipeId = "iron-smelting";
      smelter.buffer = {iron: 100};
    }
    world.campaign.pollution = 100;

    world = run(world, 300);

    expect(world.campaign.pollution).toBeGreaterThan(110);
  });

  it("does not waste water when there is no pollution", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "boiler");
    let world = engine.getWorld();
    world.machines[0].recipeId = "water-purification";
    world.machines[0].buffer = {water: 2};
    world = run(world, 40);

    expect(world.machines[0]).toMatchObject({active: false, progress: 0, buffer: {water: 2}});
  });

  it.each(["iron", "coal", "water", "ironPlate", "steel", "copper", "copperWire", "circuit"] as ResourcesType[])(
    "recycles %s into construction materials", resource => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeMachine(0, 0, "recycler")).toBe(true);
    let world = engine.getWorld();
    const initialMaterials = world.campaign.constructionMaterials;
    world.machines[0].recipeId = "recycling";
    world.machines[0].buffer = {[resource]: 1};

    world = run(world, 25);

    expect(world.machines[0].buffer[resource]).toBe(0);
    expect(world.campaign.constructionMaterials).toBe(initialMaterials + 1);
  });
});
