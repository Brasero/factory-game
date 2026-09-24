import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import type {Machine} from "@engine/models/Machine";
import type {World} from "@engine/models/World";
import {runProduction} from "./ProductionSystem";

function smelterWorld(buffer: Partial<Machine["buffer"]>): World {
  const engine = new GameEngine(createTestWorld());
  engine.placeMachine(5, 5, "iron-smelter");
  const world = engine.getWorld();
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
    world.machines[0].buffer = {copper: 1};
    world = run(world, 18);
    expect(world.machines[0].buffer).toMatchObject({copper: 0, copperWire: 2});

    world.machines[0].recipeId = "circuit-assembly";
    world.machines[0].progress = 0;
    world.machines[0].buffer = {ironPlate: 1, copperWire: 2};
    world = run(world, 35);
    expect(world.machines[0].buffer).toMatchObject({ironPlate: 0, copperWire: 0, circuit: 1});
  });

  it("consumes water to rapidly reduce pollution", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "boiler");
    let world = engine.getWorld();
    world.machines[0].buffer = {water: 1};
    world.campaign.pollution = 50;

    world = run(world, 19);
    expect(world.machines[0]).toMatchObject({active: true, progress: 19, buffer: {water: 1}});
    world = run(world, 1);

    expect(world.machines[0]).toMatchObject({active: true, progress: 0, buffer: {water: 0}});
    expect(world.campaign.pollution).toBeCloseTo(37.6);
  });

  it("does not waste water when there is no pollution", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(0, 0, "boiler");
    let world = engine.getWorld();
    world.machines[0].buffer = {water: 2};
    world = run(world, 40);

    expect(world.machines[0]).toMatchObject({active: false, progress: 0, buffer: {water: 2}});
  });
});
