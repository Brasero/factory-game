import {describe, it, expect} from "vitest";
import {GameEngine} from "./GameEngine";
import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import {createTestWorld} from "@engine/test/createTestWorld";
import {createWorld} from "@engine/world/WorldFactory";

describe("Placement rules", () => {
  it("keeps production machines placeable on the generated first island", () => {
    const engine = new GameEngine(createWorld());
    const placeable = (type: "iron-smelter" | "water-pump" | "miner") => {
      for (let y = 0; y < 190; y++) {
        for (let x = 0; x < 250; x++) if (engine.canPlaceMachine(x, y, type)) return true;
      }
      return false;
    };

    expect(placeable("miner")).toBe(true);
    expect(placeable("water-pump")).toBe(true);
    expect(placeable("iron-smelter")).toBe(true);
  });

  it("does not apply machine variant locks to logistics placement", () => {
    const world = createTestWorld();
    world.campaign.levels[1].status = "locked";
    world.campaign.levels[2].status = "locked";
    const engine = new GameEngine(world);

    expect(engine.canPlaceMachine(0, 0, "iron-smelter", "industrial")).toBe(false);
    expect(engine.canPlaceMachine(0, 0, "storage", "industrial")).toBe(true);
    expect(engine.canPlaceMachine(0, 0, "conveyor", "industrial")).toBe(true);
  });
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
    let engine = new GameEngine(createTestWorld());
    engine.placeConveyor(0, 0, "right");
    const initial = engine.getWorld();
    initial.conveyors[0].carrying.push({type: "coal", amount: 1, progress: 0.5});
    engine = new GameEngine(initial);
    expect(engine.placeConveyor(0, 0, "down")).toBe(true);
    expect(engine.getWorld().conveyors[0].carrying).toHaveLength(1);
    engine.destroyEntityAt(0, 0);
    expect(engine.placeStorage(0, 0)).toBe(true);
  });

  it.each(["splitter", "merger"] as const)("replaces a belt with a %s without losing carried resources", type => {
    let engine = new GameEngine(createTestWorld());
    expect(engine.placeConveyor(0, 0, "right")).toBe(true);
    const initial = engine.getWorld();
    const beltId = initial.conveyors[0].id;
    initial.conveyors[0].carrying.push({type: "iron", amount: 2, progress: 0.75});
    engine = new GameEngine(initial);

    expect(engine.canPlaceMachine(0, 0, type)).toBe(true);
    expect(engine.placeConveyor(0, 0, "down", type)).toBe(true);
    expect(engine.getWorld().conveyors).toEqual([expect.objectContaining({
      id: beltId,
      type,
      direction: "down",
      routingCursor: 0,
      carrying: [{type: "iron", amount: 2, progress: 0.75}]
    })]);
  });
});
