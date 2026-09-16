import {describe, expect, it} from "vitest";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor";
import {createTestWorld} from "@engine/test/createTestWorld";
import {GameEngine} from "@engine/core/GameEngine";
import {runConveyors} from "./ConveyorSystem";
import {buildNetworkTopology, directions, nextPosition, outputDirections} from "./NetworkTopology";

const node = (x: number, y: number, direction: DirectionType, type: Conveyor["type"] = "conveyor"): Conveyor => ({
  id: `${x},${y}`, x, y, direction, type, entityType: "conveyor", capacity: 3, speed: 0.2, carrying: []
});
const packet = () => ({type: "iron" as const, amount: 1, progress: 1});
const total = (belts: Conveyor[]) => belts.flatMap(c => c.carrying).reduce((n, item) => n + item.amount, 0);

describe("Explicit conveyor routing", () => {
  it.each(directions)("splits fairly across available ports facing %s", direction => {
    const world = createTestWorld();
    const splitter = node(3, 3, direction, "splitter");
    splitter.carrying = [packet(), packet(), packet()];
    world.conveyors = [splitter, ...outputDirections(splitter).map(dir => {
      const pos = nextPosition(splitter, dir);
      return node(pos.x, pos.y, dir);
    })];
    runConveyors(world);
    expect(world.conveyors[0].carrying).toHaveLength(0);
    expect(world.conveyors.slice(1).map(c => c.carrying.length)).toEqual([1, 1, 1]);
    expect(world.conveyors.slice(1).every(c => c.carrying[0].progress === 0)).toBe(true);
    expect(total(world.conveyors)).toBe(3);
  });

  it("skips full outputs, retains packets when blocked, and resumes", () => {
    const world = createTestWorld();
    const splitter = node(2, 2, "right", "splitter");
    splitter.carrying = [packet(), packet()];
    const full = node(3, 2, "right"); full.capacity = 1; full.carrying = [packet()];
    const free = node(2, 3, "down"); free.capacity = 1;
    world.conveyors = [splitter, full, free];
    runConveyors(world);
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([1, 1, 1]);
    for (let i = 0; i < 10; i++) runConveyors(world);
    expect(total(world.conveyors)).toBe(3);
    world.conveyors[2].carrying = [];
    runConveyors(world);
    expect(world.conveyors[0].carrying).toHaveLength(0);
    expect(total(world.conveyors)).toBe(2);
  });

  it.each(directions)("accepts only the configured input ports facing %s", direction => {
    for (const type of ["merger", "splitter"] as const) {
      for (const side of directions) {
        const world = createTestWorld();
        const router = node(3, 3, direction, type);
        const pos = nextPosition(router, side);
        const source = node(pos.x, pos.y, directions[(directions.indexOf(side) + 2) % 4]);
        source.carrying = [packet()];
        world.conveyors = [source, router];
        runConveyors(world);
        const allowed = type === "merger" ? side !== direction
          : directions.indexOf(side) === (directions.indexOf(direction) + 2) % 4;
        expect(world.conveyors[1].carrying.length).toBe(allowed ? 1 : 0);
        expect(total(world.conveyors)).toBe(1);
      }
    }
  });

  it("alternates saturated merger inputs independently of insertion order", () => {
    const run = (reverse: boolean) => {
      const world = createTestWorld();
      const merger = node(3, 3, "right", "merger"); merger.capacity = 1;
      world.conveyors = [node(2, 3, "right"), node(3, 2, "down"), node(3, 4, "up"), merger];
      if (reverse) world.conveyors.reverse();
      const winners: string[] = [];
      const network = buildNetworkTopology(world);
      for (let turn = 0; turn < 6; turn++) {
        world.conveyors.forEach(c => { c.carrying = c.type === "merger" ? [] : [packet()]; });
        runConveyors(world, network);
        winners.push(world.conveyors.find(c => c.type === "conveyor" && !c.carrying.length)!.id);
        expect(total(world.conveyors)).toBe(3);
      }
      return winners;
    };
    const winners = run(false);
    expect(winners).toEqual(run(true));
    expect(new Set(winners.slice(0, 3)).size).toBe(3);
    expect(winners.slice(0, 3)).toEqual(winners.slice(3));
  });

  it("keeps implicit junctions blocked even when fed by a splitter", () => {
    const world = createTestWorld();
    world.conveyors = [node(2, 2, "right", "splitter"), node(3, 1, "down"), node(3, 2, "right")];
    world.conveyors[0].carrying = [packet()];
    runConveyors(world);
    expect(world.conveyors[2].carrying).toHaveLength(0);
    expect(total(world.conveyors)).toBe(1);
  });

  it("never feeds a belt through its front, so facing belts keep their items", () => {
    const world = createTestWorld();
    world.conveyors = [node(4, 4, "right"), node(5, 4, "left")];
    world.conveyors[0].carrying = [packet()];
    const network = buildNetworkTopology(world);
    for (let i = 0; i < 20; i++) {
      runConveyors(world, network);
      expect(world.conveyors.map(c => c.carrying.length)).toEqual([1, 0]);
    }
    expect(world.conveyors[0].carrying[0].progress).toBe(1);
  });

  it.each(["splitter", "merger"] as const)("does not push %s packets into belts facing its outputs", type => {
    const world = createTestWorld();
    const router = node(3, 3, "right", type);
    router.carrying = [packet(), packet()];
    world.conveyors = [router, node(4, 3, "left"), node(3, 4, "up"), node(3, 2, "down")];
    for (let i = 0; i < 20; i++) runConveyors(world);
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([2, 0, 0, 0]);
  });

  it("ignores rejected belts when detecting implicit junctions", () => {
    const world = createTestWorld();
    // (4,1) pointe vers l'avant de (3,1) : refuse, il ne doit pas bloquer l'entree legitime (2,1).
    world.conveyors = [node(2, 1, "right"), node(3, 1, "right"), node(4, 1, "left")];
    world.conveyors[0].carrying = [packet()];
    runConveyors(world);
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([0, 1, 0]);
  });

  it("sends packets refused by a machine to the splitter's other outputs", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(4, 3, "iron-smelter");
    const world = engine.getWorld();
    const splitter = node(3, 3, "right", "splitter");
    splitter.carrying = [{...packet(), type: "coal"}];
    world.conveyors = [splitter, node(3, 4, "down")];
    runConveyors(world);
    expect(world.machines[0].buffer).toEqual({});
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([0, 1]);
  });

  it.each(["splitter", "merger"] as const)("places, rotates and destroys %s with cache invalidation", type => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeConveyor(0, 0, "right", type)).toBe(true);
    expect(engine.canPlaceMachine(0, 0, type)).toBe(true);
    expect(engine.placeConveyor(0, 0, "right")).toBe(false);
    const world = engine.getWorld();
    world.conveyors[0].carrying = [packet()];
    const loaded = new GameEngine(world);
    loaded.tick();
    expect(loaded.placeConveyor(0, 0, "down", type)).toBe(true);
    expect(loaded.getSnapshot().conveyors[0].carrying).toHaveLength(1);
    expect(loaded.placeStorage(0, 1)).toBe(true);
    loaded.tick();
    expect(loaded.getSnapshot().resources.iron).toBe(1);
    loaded.destroyEntityAt(0, 0);
    expect(loaded.getSnapshot().conveyors).toHaveLength(0);
    expect(loaded.placeConveyor(0, 0, "up", type)).toBe(true);
  });
});
