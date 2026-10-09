import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {serializeWorld, restoreWorld} from "@engine/api/saveGame";
import {runContracts} from "./ContractSystem";
import {runStorageOutputs} from "./StorageOutputSystem";
import type {Resources} from "@engine/models/Resources";

function fixture(stored: Partial<Resources> = {}) {
  const world = createTestWorld();
  world.storages = [{id: "depot", x: 1, y: 0, entityType: "storage", kind: "shipping-depot", capacity: 200, stored}];
  world.grid!.occupy({x: 1, y: 0});
  return world;
}

describe("Community contracts", () => {
  it("gates acceptance on unlocks and rejects duplicate acceptance", () => {
    const world = fixture(); world.campaign.levels[1].status = "locked";
    const engine = new GameEngine(world);
    expect(engine.acceptContract("port")).toBe(false);
    expect(engine.acceptContract("unknown")).toBe(false);
    expect(engine.acceptContract("school")).toBe(true);
    expect(engine.acceptContract("school")).toBe(false);
    expect(engine.assignContract("depot", "school")).toBe(true);
  });

  it("accepts partial transfers, consumes exactly the order and rewards once without campaign exports", () => {
    const world = fixture();
    world.conveyors = [{id: "belt", x: 0, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: .2,
      carrying: [{type: "ironPlate", amount: 20, progress: 1}]}];
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.assignContract("depot", "school");
    engine.tick();
    const snapshot = engine.getSnapshot();
    expect(snapshot.conveyors[0].carrying[0].amount).toBe(5);
    expect(snapshot.storages[0].stored.ironPlate).toBe(0);
    expect(snapshot.campaign.contracts?.school.status).toBe("completed");
    expect(snapshot.campaign.statistics.exported.ironPlate).toBe(0);
    expect(snapshot.campaign.levels[0].status).toBe("active");
    expect(snapshot.campaign.constructionMaterials).toBe(170);
    engine.tick();
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(170);
    expect(engine.acceptContract("school")).toBe(false);
    expect(engine.getSnapshot().conveyors[0].carrying[0].amount).toBe(5);
  });

  it("rejects unneeded products and preserves them on the belt", () => {
    const world = fixture();
    world.conveyors = [{id: "belt", x: 0, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: .2,
      carrying: [{type: "coal", amount: 7, progress: 1}]}];
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.assignContract("depot", "school"); engine.tick();
    expect(engine.getSnapshot().conveyors[0].carrying[0].amount).toBe(7);
    expect(engine.getSnapshot().storages[0].stored.coal ?? 0).toBe(0);
  });

  it("respects shared depot capacity while keeping the remainder on the belt", () => {
    const world = fixture(); world.storages[0].capacity = 5;
    world.conveyors = [{id: "belt", x: 0, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: .2,
      carrying: [{type: "ironPlate", amount: 20, progress: 1}]}];
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.assignContract("depot", "school"); engine.tick();
    const snapshot = engine.getSnapshot();
    expect(snapshot.storages[0].stored.ironPlate).toBe(5);
    expect(snapshot.conveyors[0].carrying[0].amount).toBe(15);
    expect(snapshot.campaign.contracts?.school.reserved.ironPlate).toBe(5);
    expect(snapshot.campaign.contracts?.school.status).toBe("active");
  });

  it("holds reserved goods and releases them through the network after cancellation", () => {
    const engine = new GameEngine(fixture({ironPlate: 5}));
    engine.acceptContract("school"); engine.assignContract("depot", "school");
    engine.placeConveyor(1, 1, "down"); engine.tick();
    expect(engine.getSnapshot().storages[0].stored.ironPlate).toBe(5);
    expect(engine.getSnapshot().conveyors[0].carrying).toHaveLength(0);
    expect(engine.cancelContract("school")).toBe(true);
    engine.tick();
    const snapshot = engine.getSnapshot();
    expect(snapshot.storages[0].stored.ironPlate).toBe(4);
    expect(snapshot.conveyors[0].carrying[0].amount).toBe(1);
    expect(snapshot.campaign.contracts?.school.reserved).toEqual({});
    expect(snapshot.campaign.constructionMaterials).toBe(149);
  });

  it("reassigns an inventory without duplicating reservations and allows parallel orders", () => {
    const world = fixture({ironPlate: 5});
    world.storages.push({id: "other", x: 3, y: 0, entityType: "storage", kind: "shipping-depot", capacity: 200, stored: {steel: 12}});
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.acceptContract("port"); engine.acceptContract("bridge");
    expect(engine.assignContract("depot", "school")).toBe(true);
    expect(engine.assignContract("other", "school")).toBe(true);
    expect(engine.assignContract("depot", "port")).toBe(true);
    expect(engine.getSnapshot().campaign.contracts?.school.reserved.ironPlate).toBe(0);
    expect(engine.getSnapshot().campaign.contracts?.port.reserved.ironPlate).toBe(5);
    expect(engine.assignContract("other", "bridge")).toBe(true);
    engine.tick();
    expect(engine.getSnapshot().campaign.contracts?.bridge.status).toBe("completed");
    expect(engine.getSnapshot().campaign.contracts?.port.status).toBe("active");
    expect(engine.getSnapshot().storages[0].stored.ironPlate).toBe(5);
  });

  it("fails precisely at the deadline, retains stock and lets the player retry", () => {
    const engine = new GameEngine(fixture({steel: 11}));
    engine.acceptContract("bridge"); engine.assignContract("depot", "bridge");
    const world = engine.getWorld();
    world.tick = 1800; world.storages[0].stored.steel = 12;
    runContracts(world);
    expect(world.campaign.contracts?.bridge.status).toBe("failed");
    expect(world.storages[0].stored.steel).toBe(12);
    expect(world.storages[0].contractId).toBeUndefined();
    expect(world.campaign.constructionMaterials).toBe(150);
    const resumed = new GameEngine(world);
    expect(resumed.acceptContract("bridge")).toBe(true);
    expect(resumed.getSnapshot().campaign.contracts?.bridge.deadlineAt).toBe(3600);
    expect(resumed.getSnapshot().campaign.contracts?.bridge.attempts).toBe(2);
  });

  it("requires a full composed order before consuming any product", () => {
    const engine = new GameEngine(fixture({ironPlate: 20, steel: 9}));
    engine.acceptContract("port"); engine.assignContract("depot", "port"); engine.tick();
    expect(engine.getSnapshot().campaign.contracts?.port.status).toBe("active");
    expect(engine.getSnapshot().storages[0].stored).toEqual({ironPlate: 20, steel: 9});
    const world = engine.getWorld(); world.storages[0].stored.steel = 10;
    runContracts(world);
    expect(world.storages[0].stored).toEqual({ironPlate: 0, steel: 0});
    expect(world.campaign.contracts?.port.status).toBe("completed");
  });

  it("suspends rate effort on interruptions and observes once per tick", () => {
    const engine = new GameEngine(fixture({circuit: 8}));
    engine.acceptContract("workshop"); engine.assignContract("depot", "workshop");
    const world = engine.getWorld(), progress = world.campaign.contracts!.workshop;
    const level = world.campaign.levels[1];
    level.telemetry = {lastExports: {}, rates: {steel: 2}, samples: Array.from({length: 100}, (_, tick) => ({tick, exports: {}})), record: 0};
    progress.sustained = 98;
    runContracts(world); runContracts(world);
    expect(progress.sustained).toBe(99);
    world.tick++; level.telemetry.rates.steel = 0; runContracts(world);
    expect(progress.sustained).toBe(99);
    world.tick++; level.telemetry.rates.steel = 2; runContracts(world);
    expect(progress.status).toBe("completed");
    expect(world.storages[0].stored.circuit).toBe(0);
  });

  it("protects stocked depots from demolition and returns unneeded ingredients", () => {
    const engine = new GameEngine(fixture({ironPlate: 5, coal: 3}));
    engine.acceptContract("school"); engine.assignContract("depot", "school");
    expect(engine.destroyEntityAt(1, 0)).toBe(false);
    const world = engine.getWorld();
    world.conveyors = [{id: "out", x: 2, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", speed: .2, capacity: 3, carrying: []}];
    const output = runStorageOutputs(world);
    expect(output.storages[0].stored.ironPlate).toBe(5);
    expect(output.storages[0].stored.coal).toBe(2);
    expect(output.conveyors[0].carrying[0].type).toBe("coal");
  });

  it("saves reservations, assignments and deadlines and remains compatible with old saves", () => {
    const engine = new GameEngine(fixture({steel: 7}));
    engine.acceptContract("bridge"); engine.assignContract("depot", "bridge");
    const save = serializeWorld(engine.getWorld()), restored = restoreWorld(save);
    expect(restored.campaign.contracts).toEqual(engine.getSnapshot().campaign.contracts);
    expect(restored.storages).toEqual(engine.getSnapshot().storages);
    const resumed = new GameEngine(restored);
    expect(resumed.getSnapshot().tick).toBe(0);
    expect(resumed.getSnapshot().campaign.contracts?.bridge.deadlineAt).toBe(1800);
    delete save.campaign.contracts;
    expect(restoreWorld(save).campaign.contracts).toEqual({});
  });

  it("does not consume products or grant rewards after game over", () => {
    const engine = new GameEngine(fixture({ironPlate: 15}));
    engine.acceptContract("school"); engine.assignContract("depot", "school");
    const world = engine.getWorld(); world.campaign.status = "game-over";
    expect(runContracts(world)).toBe(false);
    expect(world.campaign.contracts?.school.status).toBe("active");
    expect(world.campaign.constructionMaterials).toBe(150);
    expect(world.storages[0].stored.ironPlate).toBe(15);
  });

  it("charges the shipping construction and allows assignment changes on finalized islands", () => {
    const engine = new GameEngine(createTestWorld());
    expect(engine.placeStorage(0, 0, "shipping-depot")).toBe(true);
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(130);
    expect(engine.getSnapshot().storages[0].kind).toBe("shipping-depot");
    const world = engine.getWorld(); world.campaign.levels[0].status = "completed";
    const locked = new GameEngine(world);
    locked.acceptContract("school"); locked.finalizeLevel("level-1");
    expect(locked.assignContract(world.storages[0].id, "school")).toBe(true);
    expect(locked.destroyEntityAt(0, 0)).toBe(false);
  });
  it("combines partial inventories on finalized and active islands and consumes exactly once", () => {
    const world = fixture({ironPlate: 7});
    world.campaign.levels[0].status = "finalized";
    world.storages.push({id: "second", x: 120, y: 55, entityType: "storage", kind: "shipping-depot", capacity: 200, stored: {ironPlate: 8, coal: 4}});
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.assignContract("depot", "school"); engine.assignContract("second", "school");
    expect(engine.getSnapshot().campaign.contracts!.school.reserved.ironPlate).toBe(15);
    engine.tick(); engine.tick();
    expect(engine.getSnapshot().storages.map(depot => depot.stored.ironPlate)).toEqual([0, 0]);
    expect(engine.getSnapshot().storages[1].stored.coal).toBe(4);
    expect(engine.getSnapshot().storages.every(depot => !depot.contractId)).toBe(true);
    expect(engine.getSnapshot().campaign.constructionMaterials).toBe(170);
  });

  it("limits simultaneous inputs to the global missing quantity and preserves the remainder", () => {
    const world = fixture({ironPlate: 5});
    world.storages.push({id: "second", x: 3, y: 0, entityType: "storage", kind: "shipping-depot", capacity: 200, stored: {ironPlate: 3}});
    world.conveyors = [0, 2].map((x, i) => ({id: `belt${i}`, x, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: .2,
      carrying: [{type: "ironPlate", amount: 10, progress: 1}]}));
    const engine = new GameEngine(world);
    engine.acceptContract("school"); engine.assignContract("depot", "school"); engine.assignContract("second", "school");
    engine.tick();
    const snapshot = engine.getSnapshot();
    expect(snapshot.campaign.contracts!.school.status).toBe("completed");
    expect(snapshot.storages.reduce((sum, depot) => sum + (depot.stored.ironPlate ?? 0), 0)).toBe(0);
    expect(snapshot.conveyors.reduce((sum, belt) => sum + belt.carrying.reduce((n, item) => n + item.amount, 0), 0)).toBe(13);
  });

  it("reserves exactly the global target and releases only the surplus, independently of depot array order", () => {
    for (const reverse of [false, true]) {
      const world = fixture({ironPlate: 10});
      world.storages.push({id: "second", x: 3, y: 0, entityType: "storage", kind: "shipping-depot", capacity: 200, stored: {ironPlate: 10}});
      if (reverse) world.storages.reverse();
      const engine = new GameEngine(world);
      engine.acceptContract("school"); engine.assignContract("depot", "school"); engine.assignContract("second", "school");
      const working = engine.getWorld();
      working.conveyors = [1, 3].map((x, i) => ({id: `out${i}`, x, y: 1, entityType: "conveyor", type: "conveyor", direction: "down", capacity: 3, speed: .2, carrying: []}));
      const output = runStorageOutputs(working);
      expect(output.storages.find(depot => depot.id === "depot")!.stored.ironPlate).toBe(10);
      expect(output.storages.find(depot => depot.id === "second")!.stored.ironPlate).toBe(9);
      expect(output.conveyors[0].carrying).toHaveLength(0);
      expect(output.conveyors[1].carrying[0].amount).toBe(1);
      expect(output.campaign.contracts!.school.reserved.ironPlate).toBe(15);
    }
  });

  it("migrates old depot numbers and preserves them and the next number through saves and demolition", () => {
    const engine = new GameEngine(fixture());
    expect(engine.getSnapshot().storages[0].depotNumber).toBe(1);
    expect(engine.placeStorage(3, 0, "shipping-depot")).toBe(true);
    expect(engine.getSnapshot().storages[1].depotNumber).toBe(2);
    expect(engine.destroyEntityAt(1, 0)).toBe(true);
    const restored = new GameEngine(restoreWorld(serializeWorld(engine.getWorld())));
    expect(restored.getSnapshot().storages[0].depotNumber).toBe(2);
    expect(restored.placeStorage(1, 0, "shipping-depot")).toBe(true);
    expect(restored.getSnapshot().storages[1].depotNumber).toBe(3);
  });

});
