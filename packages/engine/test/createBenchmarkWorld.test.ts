import {expect, it} from "vitest";
import {createBenchmarkWorld} from "./createBenchmarkWorld";

it("creates a repeatable mixed scene with valid, distinct occupied positions", () => {
  const world = createBenchmarkWorld(1000);
  expect(world).toEqual(createBenchmarkWorld(1000));
  expect(world.conveyors).toHaveLength(1000);
  expect(world.machines).toHaveLength(5);
  expect(world.storages).toHaveLength(5);
  const entities = [...world.conveyors, ...world.machines, ...world.storages];
  expect(new Set(entities.map(e => `${e.x},${e.y}`)).size).toBe(entities.length);
  for (const entity of entities) {
    expect(world.grid!.isInside(entity)).toBe(true);
    expect(world.grid!.isOccupied(entity)).toBe(true);
    expect(world.grid!.getTile(entity.x, entity.y)?.decoration).toBeUndefined();
  }
  expect(world.grid!.getResourceMap()).toHaveLength(5);
  expect(world.grid!.getTile(0, 2)?.decoration?.type).toBe("tree");
  expect(world.machines.every(m => m.spriteName)).toBe(true);
});
