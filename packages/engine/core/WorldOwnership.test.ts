import {describe, expect, it} from "vitest";
import {GameEngine} from "./GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";

describe("Engine world ownership", () => {
  it("isolates constructor input and exported worlds, including nested state and occupancy", () => {
    const setup = new GameEngine(createTestWorld());
    setup.placeConveyor(0, 0, "right");
    setup.placeStorage(1, 0);
    setup.placeMachine(1, 1, "iron-mine");
    const initial = setup.getWorld();
    initial.conveyors[0].carrying = [{type: "iron", amount: 3, progress: 0}];
    const engine = new GameEngine(initial);
    const control = new GameEngine(initial);
    engine.tick(); control.tick(); // Populate the connection cache before external edits.
    for (const external of [initial, engine.getWorld()]) {
      external.conveyors[0].direction = "down";
      external.conveyors[0].carrying[0].amount = 999;
      external.conveyors.reverse();
      external.storages[0].stored.iron = 999;
      external.machines[0].buffer.coal = 999;
      external.resources.iron = 999;
      external.grid!.free({x: 0, y: 0});
      external.grid!.setResource(1, 1, "coal");
      external.conveyors.length = 0;
    }
    expect(engine.canPlaceMachine(0, 0, "storage")).toBe(false);
    expect(engine.placeStorage(0, 0)).toBe(false);
    for (let i = 0; i < 15; i++) { engine.tick(); control.tick(); }
    expect(engine.getSnapshot()).toEqual(control.getSnapshot());
    expect(engine.getSnapshot().storages[0].stored.iron).toBe(3);
  });

  it("isolates dynamic snapshots while reusing immutable terrain", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeConveyor(0, 0, "right");
    const snapshot = engine.getSnapshot();
    snapshot.conveyors[0].direction = "down";
    snapshot.conveyors.length = 0;
    snapshot.resources.iron = 999;
    const next = engine.getSnapshot();
    expect(next.conveyors[0].direction).toBe("right");
    expect(next.resources.iron).toBe(0);
    expect(next.grid).toBe(snapshot.grid);
    expect(Object.isFrozen(next.grid!.tiles![0][0])).toBe(true);
  });
});
