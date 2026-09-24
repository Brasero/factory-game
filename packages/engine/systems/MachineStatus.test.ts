import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {machineIdleReason} from "./MachineStatus";

describe("Machine idle diagnostics", () => {
  it("prioritizes an explicit pause", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(5, 5, "iron-smelter");
    const machine = engine.getWorld().machines[0];
    machine.paused = true;
    expect(machineIdleReason(machine, 20)).toEqual({type: "paused"});
  });

  it("reports missing inputs and saturated outputs", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(5, 5, "assembler");
    const machine = engine.getWorld().machines[0];
    machine.recipeId = "circuit-assembly";
    expect(machineIdleReason(machine, 20)).toEqual({type: "missing-input", resource: "ironPlate"});
    machine.buffer = {ironPlate: 1, copperWire: 2, circuit: 100};
    expect(machineIdleReason(machine, 20)).toEqual({type: "output-full", resource: "circuit"});
  });

  it("reports when a production machine has no selected recipe", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(5, 5, "iron-smelter");
    const machine = engine.getWorld().machines[0];
    machine.recipeId = undefined;
    expect(machineIdleReason(machine, 20)).toEqual({type: "no-recipe"});
  });

  it("explains full extractors and an idle boiler", () => {
    const engine = new GameEngine(createTestWorld());
    engine.placeMachine(1, 1, "iron-mine");
    engine.placeMachine(5, 5, "boiler");
    const [miner, boiler] = engine.getWorld().machines;
    miner.buffer.iron = 100;
    boiler.buffer.water = 1;
    expect(machineIdleReason(miner, 20)).toEqual({type: "buffer-full"});
    expect(machineIdleReason(boiler, 0)).toEqual({type: "pollution-empty"});
  });
});
