import {describe, it, expect, vi} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import * as topology from "./NetworkTopology";

describe("Cached connections", () => {
  it("reuses connections between ticks and invalidates edits", () => {
    const build = vi.spyOn(topology, "buildNetworkTopology");
    const engine = new GameEngine(createTestWorld());
    engine.placeConveyor(0, 0, "right");
    engine.placeStorage(1, 0);
    engine.tick(); engine.tick();
    expect(build).toHaveBeenCalledTimes(1);
    const load = () => { engine.getWorld().conveyors[0].carrying = [{type: "iron", amount: 1, progress: 1}]; };
    load(); engine.tick();
    expect(engine.getWorld().resources.iron).toBe(1);
    engine.placeConveyor(0, 0, "down");
    engine.placeStorage(0, 1);
    load(); engine.tick();
    expect(build).toHaveBeenCalledTimes(2);
    expect(engine.getWorld().storages[1].stored.iron).toBe(1);
    engine.destroyEntityAt(0, 1);
    load(); engine.tick();
    expect(engine.getWorld().conveyors[0].carrying).toHaveLength(1);
    engine.placeStorage(0, 1);
    engine.tick();
    expect(engine.getWorld().storages[1].stored.iron).toBe(1);
  });
  it("uses current buffers and total machine capacity, not cached inventories", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(1, 1, "iron-mine");
    engine.placeConveyor(1, 0, "down");
    engine.tick();
    const machine = engine.getWorld().machines[0];
    machine.buffer.coal = 99;
    engine.getWorld().conveyors[0].carrying = [{type: "water", amount: 3, progress: 1}];
    engine.tick();
    expect(engine.getWorld().machines[0].buffer.water).toBe(1);
    expect(engine.getWorld().conveyors[0].carrying[0].amount).toBe(2);
    engine.getWorld().machines[0].buffer.coal = 97;
    engine.tick();
    expect(engine.getWorld().machines[0].buffer.water).toBe(3);
    expect(engine.getWorld().conveyors[0].carrying).toHaveLength(0);
  });
});
