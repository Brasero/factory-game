import {describe, it, expect} from "vitest";
import {runConveyors} from "./ConveyorSystem";
import {runOutputMachine} from "./MachineOutputSystem";
import {runStorageOutputs} from "./StorageOutputSystem";
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
    let world = engine.getWorld();
    world.machines[0].buffer.water = 5;
    for (let i = 0; i < 5; i++) world = runOutputMachine(world);
    expect(world.conveyors[0].carrying).toHaveLength(3);
    expect(world.machines[0].buffer.water).toBe(2);
  });

  it("does not export into a belt pointing back into the machine", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(3, 1, "water-pump");
    engine.placeConveyor(4, 1, "left");
    const world = engine.getWorld();
    world.machines[0].buffer.water = 5;
    const exported = runOutputMachine(world);
    expect(exported.conveyors[0].carrying).toHaveLength(0);
    expect(exported.machines[0].buffer.water).toBe(5);
  });

  it("feeds machines only with their recipe ingredient", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(5, 5, "iron-smelter");
    engine.placeMachine(1, 1, "iron-mine");
    const world = engine.getWorld();
    world.conveyors = [belt(4, 5, "right"), belt(0, 1, "right")];
    world.conveyors.forEach(c => { c.carrying[0].type = "coal"; });
    runConveyors(world);
    // Le charbon ne bloque plus la fonderie et la mine n'accepte aucune ressource.
    expect(world.machines.map(m => m.buffer)).toEqual([{}, {}]);
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([1, 1]);
    world.conveyors.forEach(c => { c.carrying[0].type = "iron"; });
    runConveyors(world);
    expect(world.machines.map(m => m.buffer)).toEqual([{iron: 1}, {}]);
    expect(world.conveyors.map(c => c.carrying.length)).toEqual([0, 1]);
  });

  it("updates HUD totals in the transfer tick and after destruction", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeStorage(2, 1);
    const initial = engine.getWorld();
    initial.conveyors = [belt(1, 1, "right")];
    const loaded = new GameEngine(initial);
    loaded.tick();
    expect(loaded.getSnapshot().resources.iron).toBe(1);
    loaded.destroyEntityAt(2, 1);
    expect(loaded.getSnapshot().resources.iron).toBe(0);
  });

  it("lets adjacent machines pull ingredients from storage and produce iron plates", () => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeStorage(0, 0)).toBe(true);
    expect(engine.placeMachine(1, 0, "iron-smelter")).toBe(true);
    let world = engine.getWorld();
    world.storages[0].stored.iron = 1;
    const loaded = new GameEngine(world);
    for (let i = 0; i < 20; i++) loaded.tick();
    world = loaded.getWorld();
    expect(world.storages[0].stored.iron).toBe(0);
    expect(world.machines[0].buffer.ironPlate).toBe(1);
  });

  it("exports storage resources only to belts that do not point back into the chest", () => {
    const outward = createTestWorld();
    outward.storages = [{id: "storage", entityType: "storage", x: 0, y: 0, capacity: 200, stored: {iron: 1, coal: 0, water: 0, ironPlate: 0}}];
    outward.conveyors = [belt(1, 0, "right", false)];
    const exported = runStorageOutputs(outward);
    expect(exported.storages[0].stored.iron).toBe(0);
    expect(exported.conveyors[0].carrying).toEqual([{type: "iron", amount: 1, progress: 0}]);

    const inward = createTestWorld();
    inward.storages = [{id: "storage", entityType: "storage", x: 0, y: 0, capacity: 200, stored: {iron: 1, coal: 0, water: 0, ironPlate: 0}}];
    inward.conveyors = [belt(1, 0, "left", false)];
    const blocked = runStorageOutputs(inward);
    expect(blocked.storages[0].stored.iron).toBe(1);
    expect(blocked.conveyors[0].carrying).toHaveLength(0);
  });
});
