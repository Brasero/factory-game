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
    expect(stored + carried + world.machines[0].buffer.iron).toBe(10);
  });
});
