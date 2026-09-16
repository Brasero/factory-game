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
});
