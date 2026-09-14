import {it, expect} from "vitest";
import {createTestWorld} from "@engine/test/createTestWorld";
import {buildWorldSnapshot} from "./worldSnapshot";

it("reuses immutable terrain, invalidates resource edits and isolates snapshots", () => {
  const world = createTestWorld();
  const first = buildWorldSnapshot(world);
  world.grid!.occupy({x: 0, y: 0});
  expect(buildWorldSnapshot(world).grid).toBe(first.grid);
  expect(Object.isFrozen(first.grid!.tiles[0][0])).toBe(true);
  expect(() => { first.grid!.tiles[0][0].variant = 100; }).toThrow();
  world.grid!.setResource(0, 0, "coal");
  const next = buildWorldSnapshot(world);
  expect(next.grid).not.toBe(first.grid);
  expect(next.grid!.resources).toHaveLength(first.grid!.resources.length + 1);
  expect(world.grid!.getTile(0, 0)!.variant).toBe(0);
});
