import {describe, it, expect} from "vitest";
import {runConveyors} from "./ConveyorSystem";
import {runOutputMachine} from "./MachineOutputSystem";
import {createTestWorld} from "@engine/test/createTestWorld";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor";
import {GameEngine} from "@engine/core/GameEngine";

function belt(x: number, y: number, direction: DirectionType, loaded = true): Conveyor {
  return {id: `${x},${y}`, x, y, direction, type: "conveyor", entityType: "conveyor",
    speed: 0.2, capacity: 3, carrying: loaded ? [{type: "iron", amount: 1, progress: 1}] : []};
}
const canonical = (conveyors: Conveyor[]) => [...conveyors].sort((a, b) => a.id.localeCompare(b.id));

describe("Conveyor transfers", () => {
  it("advances each item only once, independently of array order", () => {
    const a = createTestWorld();
    a.conveyors = [belt(1, 1, "right"), belt(2, 1, "right", false), belt(3, 1, "right", false)];
    const b = createTestWorld();
    b.conveyors = structuredClone(a.conveyors).reverse();
    for (let i = 0; i < 20; i++) {
      runConveyors(a); runConveyors(b);
      expect(canonical(a.conveyors)).toEqual(canonical(b.conveyors));
      expect(a.conveyors.flatMap(c => c.carrying).reduce((n, item) => n + item.amount, 0)).toBe(1);
      if (i === 0) expect(a.conveyors[1].carrying[0].progress).toBe(0);
    }
  });

  it("blocks implicit mergers even when one incoming belt is empty", () => {
    const world = createTestWorld();
    world.conveyors = [belt(1, 1, "right"), belt(2, 0, "down", false), belt(2, 1, "right", false)];
    for (let i = 0; i < 20; i++) runConveyors(world);
    expect(world.conveyors[0].carrying).toHaveLength(1);
    expect(world.conveyors[2].carrying).toHaveLength(0);
    world.conveyors.splice(1, 1);
    runConveyors(world);
    expect(world.conveyors[1].carrying).toHaveLength(1);
  });

  it("preserves resources in a saturated cycle and resumes when space opens", () => {
    const world = createTestWorld();
    world.conveyors = [belt(1, 1, "right"), belt(2, 1, "down"), belt(2, 2, "left"), belt(1, 2, "up")];
    world.conveyors.forEach(c => { c.capacity = 1; });
    for (let i = 0; i < 20; i++) runConveyors(world);
    expect(world.conveyors.every(c => c.carrying.length === 1)).toBe(true);
    world.conveyors[1].carrying = [];
    runConveyors(world);
    expect(world.conveyors[0].carrying).toHaveLength(0);
    expect(world.conveyors.flatMap(c => c.carrying)).toHaveLength(3);
  });

  it("shares total storage capacity across resources and preserves partial transfers", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeStorage(2, 1);
    const world = engine.getWorld();
    world.storages[0].capacity = 5;
    world.storages[0].stored.coal = 4;
    world.conveyors = [belt(1, 1, "right")];
    world.conveyors[0].carrying[0].amount = 3;
    runConveyors(world);
    expect(world.storages[0].stored).toEqual({coal: 4, iron: 1});
    expect(world.conveyors[0].carrying[0].amount).toBe(2);
  });

  it("reserves shared destination capacity in stable spatial order", () => {
    const make = () => {
      const engine = new GameEngine(createTestWorld());
      engine.placeStorage(2, 2);
      const world = engine.getWorld();
      world.storages[0].capacity = 1;
      world.conveyors = [belt(1, 2, "right"), belt(2, 1, "down")];
      return world;
    };
    const a = make(), b = make();
    b.conveyors.reverse();
    runConveyors(a); runConveyors(b);
    expect(canonical(a.conveyors)).toEqual(canonical(b.conveyors));
    expect(a.storages[0].stored.iron).toBe(1);
  });

  it("exports water to the right and stops when its output is full", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(3, 1, "water-pump");
    engine.placeConveyor(4, 1, "right");
    engine.getWorld().machines[0].buffer.water = 5;
    let world = engine.getWorld();
    for (let i = 0; i < 5; i++) world = runOutputMachine(world);
    expect(world.conveyors[0].carrying).toHaveLength(3);
    expect(world.machines[0].buffer.water).toBe(2);
  });

  it("updates HUD totals in the transfer tick and after destruction", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeStorage(2, 1);
    engine.getWorld().conveyors = [belt(1, 1, "right")];
    engine.tick();
    expect(engine.getWorld().resources.iron).toBe(1);
    engine.destroyEntityAt(2, 1);
    expect(engine.getWorld().resources.iron).toBe(0);
  });
});
