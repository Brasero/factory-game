import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {emptyResources} from "@engine/models/Resources";
import {runStorageOutputs} from "./StorageOutputSystem";
import {restoreWorld, serializeWorld} from "@engine/api/saveGame";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";

function fixture() {
  const world = createTestWorld();
  world.tunnels = [{id: "in", x: 1, y: 0, entityType: "tunnel", type: "input", levelId: "level-2", direction: "right", capacity: 200,
    stored: {...emptyResources(), ironPlate: 200, steel: 12}}];
  world.conveyors = [{id: "out", x: 2, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: .2, carrying: []}];
  return world;
}

describe("Tunnel resource selection", () => {
  it("extracts steel immediately while keeping all iron stored", () => {
    const engine = new GameEngine(fixture());
    expect(engine.setTunnelFilter("in", "right", "steel")).toBe(true);
    const output = runStorageOutputs(engine.getWorld());
    expect(output.conveyors[0].carrying[0].type).toBe("steel");
    expect(output.tunnels[0].stored.ironPlate).toBe(200);
    expect(output.tunnels[0].stored.steel).toBe(11);
  });
  it("waits for the selected product and restores automatic output on demand", () => {
    const engine = new GameEngine(fixture());
    engine.setTunnelFilter("in", "right", "circuit");
    expect(runStorageOutputs(engine.getWorld()).conveyors[0].carrying).toHaveLength(0);
    engine.setTunnelFilter("in", "right", "any");
    expect(runStorageOutputs(engine.getWorld()).conveyors[0].carrying[0].type).toBe("ironPlate");
  });
  it("filters machine supplies too and allows selection on finalized islands", () => {
    const world = fixture(); world.campaign.levels[1].status = "finalized";
    const engine = new GameEngine(world);
    // Factory-created machine provides the real recipe and capacity defaults.
    expect(engine.placeMachine(1, 1, "iron-smelter")).toBe(true);
    const working = engine.getWorld(); engine.selectMachineRecipe(working.machines[0].id, "steel-smelting");
    engine.setTunnelFilter("in", "down", "steel");
    expect(runStorageOutputs(engine.getWorld()).machines[0].buffer.ironPlate ?? 0).toBe(0);
    engine.setTunnelFilter("in", "down", "ironPlate");
    expect(runStorageOutputs(engine.getWorld()).machines[0].buffer.ironPlate).toBe(1);
  });
  it("rejects locked tunnels, water and output tunnels", () => {
    const world = fixture(); world.campaign.levels[1].status = "locked";
    const engine = new GameEngine(world);
    expect(engine.setTunnelFilter("in", "right", "steel")).toBe(false);
    world.campaign.levels[1].status = "active";
    world.tunnels[0].type = "output";
    expect(new GameEngine(world).setTunnelFilter("in", "right", "steel")).toBe(false);
    world.tunnels[0].type = "input";
    expect(new GameEngine(world).setTunnelFilter("in", "right", "water")).toBe(false);
  });
  it("preserves selected output through a save and defaults older saves to automatic", () => {
    const world = fixture(); const definition = CAMPAIGN_LEVELS[1].tunnels.find(tunnel => tunnel.type === "input")!;
    world.tunnels[0].id = definition.id; world.tunnels[0].outputResource = "steel";
    const save = serializeWorld(world);
    expect(restoreWorld(save).tunnels.find(tunnel => tunnel.id === definition.id)!.outputFilters).toEqual({up: "steel", right: "steel", down: "steel", left: "steel"});
    delete save.tunnels[0].outputResource;
    expect(restoreWorld(save).tunnels.find(tunnel => tunnel.id === definition.id)!.outputFilters).toBeUndefined();
  });
  it("routes different resources to different sides simultaneously without losing stock", () => {
    const world = fixture();
    world.conveyors.push({...world.conveyors[0], id: "left", x: 0, direction: "left", carrying: []});
    const engine = new GameEngine(world);
    engine.setTunnelFilter("in", "right", "steel"); engine.setTunnelFilter("in", "left", "ironPlate");
    const output = runStorageOutputs(engine.getWorld());
    expect(output.conveyors.map(belt => belt.carrying[0].type)).toEqual(["steel", "ironPlate"]);
    expect(output.tunnels[0].stored.ironPlate).toBe(199); expect(output.tunnels[0].stored.steel).toBe(11);
    expect(output.conveyors.flatMap(belt => belt.carrying).reduce((sum, item) => sum + item.amount, 0) + (output.tunnels[0].stored.ironPlate ?? 0) + (output.tunnels[0].stored.steel ?? 0)).toBe(212);
  });

  it("keeps an empty filtered side waiting, a closed side shut, and a saturated side independent", () => {
    const world = fixture();
    world.conveyors.push({...world.conveyors[0], id: "left", x: 0, direction: "left", carrying: []});
    world.tunnels[0].stored.steel = 0;
    const engine = new GameEngine(world);
    engine.setTunnelFilter("in", "right", "steel"); engine.setTunnelFilter("in", "left", "none");
    const blocked = runStorageOutputs(engine.getWorld());
    expect(blocked.conveyors.every(belt => !belt.carrying.length)).toBe(true);
    expect(blocked.tunnels[0].stored.ironPlate).toBe(200);
    world.tunnels[0].stored.steel = 12;
    world.conveyors[0].carrying = Array.from({length: 3}, () => ({type: "steel", amount: 1, progress: 1}));
    const saturated = new GameEngine(world);
    saturated.setTunnelFilter("in", "right", "steel"); saturated.setTunnelFilter("in", "left", "ironPlate");
    const output = runStorageOutputs(saturated.getWorld());
    expect(output.tunnels[0].stored.steel).toBe(12);
    expect(output.conveyors[1].carrying[0].type).toBe("ironPlate");
  });

  it("excludes explicitly filtered resources from non-filtered outputs", () => {
    const world = fixture(); world.tunnels[0].stored.ironPlate = 0;
    world.conveyors.push({...world.conveyors[0], id: "left", x: 0, direction: "left", carrying: []});
    const engine = new GameEngine(world);
    engine.setTunnelFilter("in", "right", "steel"); engine.setTunnelFilter("in", "left", "unfiltered");
    const output = runStorageOutputs(engine.getWorld());
    expect(output.conveyors[0].carrying[0].type).toBe("steel");
    expect(output.conveyors[1].carrying).toHaveLength(0);
    world.tunnels[0].stored.coal = 1;
    const other = new GameEngine(world);
    other.setTunnelFilter("in", "right", "steel"); other.setTunnelFilter("in", "left", "unfiltered");
    expect(runStorageOutputs(other.getWorld()).conveyors[1].carrying[0].type).toBe("coal");
  });

  it("saves independent filters and migrates a previous global filter when editing just one side", () => {
    const world = fixture(); world.tunnels[0].outputResource = "steel";
    const engine = new GameEngine(world);
    engine.setTunnelFilter("in", "left", "ironPlate");
    expect(engine.getSnapshot().tunnels[0].outputFilters).toEqual({up: "steel", right: "steel", down: "steel", left: "ironPlate"});
    expect(engine.getSnapshot().tunnels[0].outputResource).toBeUndefined();
    const saved = engine.getWorld(); saved.tunnels[0].id = CAMPAIGN_LEVELS[1].tunnels.find(tunnel => tunnel.type === "input")!.id;
    const restored = restoreWorld(serializeWorld(saved));
    expect(restored.tunnels.find(tunnel => tunnel.id === saved.tunnels[0].id)!.outputFilters).toEqual(saved.tunnels[0].outputFilters);
  });

});
