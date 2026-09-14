import {describe, it, expect} from "vitest";
import {GameEngine} from "./GameEngine";
import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import {createTestWorld} from "@engine/test/createTestWorld";

describe("Placement rules", () => {
  it.each(["sea", "decoration", "occupied", "fractional", "outside"])("rejects storage and belts on %s", reason => {
    const world = createTestWorld();
    world.grid = new Grid(1, 1, new TileMap(1, 1, [[{
      biome: reason === "sea" ? "sea" : "grass", variant: 0,
      decoration: reason === "decoration" ? {type: "tree", variant: 0} : undefined
    }]]));
    if (reason === "occupied") world.grid.occupy({x: 0, y: 0});
    const engine = new GameEngine(world);
    const x = reason === "fractional" ? 0.5 : reason === "outside" ? -1 : 0;
    expect(engine.placeStorage(x, 0)).toBe(false);
    expect(engine.placeConveyor(x, 0, "right")).toBe(false);
    expect(world.storages).toHaveLength(0);
    expect(world.conveyors).toHaveLength(0);
  });
  it("rotates an existing belt without losing its items, then frees the cell", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeConveyor(0, 0, "right");
    engine.getWorld().conveyors[0].carrying.push({type: "coal", amount: 1, progress: 0.5});
    expect(engine.placeConveyor(0, 0, "down")).toBe(true);
    expect(engine.getWorld().conveyors[0].carrying).toHaveLength(1);
    engine.destroyEntityAt(0, 0);
    expect(engine.placeStorage(0, 0)).toBe(true);
  });
});
