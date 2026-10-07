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
    expect(placeable("water-pump")).toBe(false);
    expect(placeable("iron-smelter")).toBe(true);
    const world = engine.getWorld();
    world.campaign.levels[1].status = "active";
    const unlockedEngine = new GameEngine(world);
    let pipePlaceable = false;
    for (let y = 31; y <= 79 && !pipePlaceable; y++) {
      for (let x = 96; x <= 144; x++) if (unlockedEngine.canPlaceMachine(x, y, "pipe")) { pipePlaceable = true; break; }
    }
    expect(pipePlaceable).toBe(true);
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

  it.each(["boiler", "advanced-assembler"] as const)("occupies and frees both cells of a %s", type => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeMachine(5, 5, type)).toBe(true);
    expect(engine.getWorld().grid?.isOccupied({x: 5, y: 5})).toBe(true);
    expect(engine.getWorld().grid?.isOccupied({x: 6, y: 5})).toBe(true);
    expect(engine.canPlaceMachine(6, 5, "storage")).toBe(false);

    expect(engine.destroyEntityAt(6, 5)).toBe(true);
    expect(engine.getWorld().grid?.isOccupied({x: 5, y: 5})).toBe(false);
    expect(engine.getWorld().grid?.isOccupied({x: 6, y: 5})).toBe(false);
  });

  it("rejects a two-cell machine when its second cell is unavailable", () => {
    const occupied = createTestWorld();
    occupied.grid!.occupy({x: 6, y: 5});
    expect(new GameEngine(occupied).placeMachine(5, 5, "boiler")).toBe(false);
    expect(new GameEngine(createTestWorld()).placeMachine(9, 5, "advanced-assembler")).toBe(false);
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

  it("unlocks mass removal of trees and rocks with level 3", () => {
    const world = createTestWorld();
    world.grid = new Grid(2, 1, new TileMap(2, 1, [[
      {biome: "grass", variant: 0, decoration: {type: "tree", variant: 0}},
      {biome: "grass", variant: 0, decoration: {type: "rock", variant: 0}}
    ]]));
    world.campaign.levels[2].status = "locked";
    let engine = new GameEngine(world);
    expect(engine.destroyEntityAt(0, 0)).toBe(false);
    expect(engine.getWorld().grid?.getTile(0, 0)?.decoration?.type).toBe("tree");

    world.campaign.levels[2].status = "active";
    engine = new GameEngine(world);
    expect(engine.destroyEntityAt(0, 0)).toBe(true);
    expect(engine.destroyEntityAt(1, 0)).toBe(true);
    expect(engine.getWorld().grid?.getTile(0, 0)?.decoration).toBeUndefined();
    expect(engine.getWorld().grid?.getTile(1, 0)?.decoration).toBeUndefined();
    expect(engine.canPlaceMachine(0, 0, "storage")).toBe(true);
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

  it("changes a belt tier and preserves it when the belt is rotated", () => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeConveyor(0, 0, "right", "conveyor", 3)).toBe(true);
    expect(engine.getSnapshot().conveyors[0].tier).toBe(3);
    expect(engine.placeConveyor(0, 0, "down")).toBe(true);
    expect(engine.getSnapshot().conveyors[0].tier).toBe(3);
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
