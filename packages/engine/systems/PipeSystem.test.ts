import {describe, expect, it} from "vitest";
import {runPipes} from "./PipeSystem";
import {createTestWorld} from "@engine/test/createTestWorld";

describe("PipeSystem", () => {
  it("moves water from a pump through pipes into a machine recipe", () => {
    const world = createTestWorld();
    world.machines.push({id: "pump", x: 0, y: 0, type: "water-pump", entityType: "machine", progress: 0,
      active: true, buffer: {water: 2}, capacity: 100, efficiency: 1, production: 1});
    world.machines.push({id: "boiler", x: 3, y: 0, type: "boiler", entityType: "machine", progress: 0,
      active: false, buffer: {}, capacity: 100, efficiency: 1, production: 1, recipeId: "water-purification"});
    world.pipes.push(
      {id: "p1", x: 1, y: 0, entityType: "pipe", direction: "right", water: 0, capacity: 10},
      {id: "p2", x: 2, y: 0, entityType: "pipe", direction: "right", water: 0, capacity: 10}
    );
    let next = runPipes(world);
    expect(next.pipes[0].water).toBe(1);
    expect(next.pipes[1].water).toBe(0);
    next = runPipes(next);
    expect(next.pipes[1].water).toBe(1);
    next = runPipes(next);
    expect(next.machines[1].buffer.water).toBe(1);
  });

  it("does not feed water to a machine without a selected recipe", () => {
    const world = createTestWorld();
    world.pipes.push({id: "p", x: 1, y: 1, entityType: "pipe", direction: "right", water: 1, capacity: 10});
    world.machines.push({id: "boiler", x: 2, y: 1, type: "boiler", entityType: "machine", progress: 0,
      active: false, buffer: {}, capacity: 100, efficiency: 1, production: 1});
    const next = runPipes(world);
    expect(next.pipes[0].water).toBe(1);
    expect(next.machines[0].buffer.water).toBeUndefined();
  });
});
