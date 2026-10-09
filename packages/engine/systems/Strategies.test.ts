import {describe, expect, it} from "vitest";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {runConveyors} from "./ConveyorSystem";
import {runStorageOutputs} from "./StorageOutputSystem";
import {runProduction} from "./ProductionSystem";
import {runPipes} from "./PipeSystem";
import {runContracts} from "./ContractSystem";
import {restoreWorld, serializeWorld} from "@engine/api/saveGame";
import {RECIPES, type RecipeId} from "@engine/config/recipeConfig";
import {naturalAbsorption, islandAbsorption} from "@engine/config/ecologyConfig";

function limitedWorld(rate?: number) {
  const engine = new GameEngine(createTestWorld());
  engine.placeConveyor(0, 0, "right"); engine.placeStorage(1, 0);
  const world = engine.getWorld();
  world.conveyors[0].outputRate = rate;
  world.conveyors[0].carrying = [{type: "iron", amount: 100, progress: 1}];
  return world;
}

describe("Logistics regulation", () => {
  it.each([0.1, 0.2, 0.3, 0.5, 1.5])("supports slow factory output at %s units per simulated second", rate => {
    const world = limitedWorld(rate);
    for (let tick = 0; tick < 100; tick++) {world.tick++; runConveyors(world);}
    expect(world.storages[0].stored.iron).toBe(rate * 10);
    expect(world.conveyors[0].carrying[0].amount).toBe(100 - rate * 10);
  });
  it.each([1, 3, 7, 10])("limits output to %i units per simulated second with exact partial transfers", rate => {
    const world = limitedWorld(rate);
    for (let tick = 0; tick < 10; tick++) { world.tick++; runConveyors(world); }
    expect(world.storages[0].stored.iron).toBe(rate);
    expect(world.conveyors[0].carrying[0].amount).toBe(100 - rate);
    expect(world.conveyors[0].transported).toBe(rate);
  });

  it("keeps a bounded credit while blocked and cannot burst after saturation clears", () => {
    const world = limitedWorld(1);
    world.storages[0].stored.iron = world.storages[0].capacity;
    for (let tick = 0; tick < 100; tick++) runConveyors(world);
    expect(world.conveyors[0].carrying[0].amount).toBe(100);
    world.storages[0].stored.iron = 0;
    runConveyors(world);
    expect(world.storages[0].stored.iron).toBe(1);
    runConveyors(world);
    expect(world.storages[0].stored.iron).toBe(1);
    expect(world.conveyors[0].outputCredit).toBeLessThan(1);
  });

  it("shares one limiter budget between packets and preserves two-phase movement", () => {
    const world = limitedWorld(10);
    world.conveyors[0].carrying = [{type: "iron", amount: 2, progress: 1}, {type: "coal", amount: 2, progress: 1}];
    runConveyors(world);
    expect(world.storages[0].stored).toEqual({iron: 1});
    expect(world.conveyors[0].carrying.reduce((sum, item) => sum + item.amount, 0)).toBe(3);
    const game = new GameEngine(createTestWorld());
    game.placeConveyor(0, 0, "right"); game.placeConveyor(1, 0, "right"); game.placeConveyor(2, 0, "right");
    const chain = game.getWorld(); chain.conveyors[0].outputRate = 10;
    chain.conveyors[0].carrying = [{type: "iron", amount: 1, progress: 1}];
    runConveyors(chain);
    expect(chain.conveyors[1].carrying).toHaveLength(1);
    expect(chain.conveyors[2].carrying).toHaveLength(0);
  });

  it.each([false, true])("respects preferred splitter outputs and falls back when full (reverse=%s)", reverse => {
    const game = new GameEngine(createTestWorld());
    game.placeConveyor(2, 2, "right", "smart-splitter");
    game.placeStorage(3, 2); game.placeStorage(2, 1); game.placeStorage(2, 3);
    const world = game.getWorld(), splitter = world.conveyors[0];
    splitter.priorityPort = "left";
    splitter.outputFilters = {forward: "any", left: "iron", right: "unfiltered"};
    if (reverse) world.storages.reverse();
    splitter.carrying = [{type: "iron", amount: 1, progress: 1}]; runConveyors(world);
    expect(world.storages.find(storage => storage.y === 1)!.stored.iron).toBe(1);
    const preferred = world.storages.find(storage => storage.y === 1)!;
    preferred.stored.iron = preferred.capacity;
    world.conveyors[0].carrying = [{type: "iron", amount: 1, progress: 1}]; runConveyors(world);
    expect(world.storages.find(storage => storage.x === 3)!.stored.iron).toBe(1);
    world.conveyors[0].carrying = [{type: "coal", amount: 1, progress: 1}]; runConveyors(world);
    expect(preferred.stored.coal).toBeUndefined();
    expect(world.storages.reduce((sum, storage) => sum + (storage.stored.coal ?? 0), 0)).toBe(1);
  });

  it("retains a reserve across all solid and water outputs without changing capacity", () => {
    const game = new GameEngine(createTestWorld());
    game.placeStorage(2, 2); game.placeConveyor(3, 2, "right"); game.placeConveyor(2, 1, "up"); game.placePipe(1, 2, "left");
    let world = game.getWorld();
    world.storages[0].reserveThreshold = 5;
    world.storages[0].stored = {iron: 6, water: 6};
    world = runStorageOutputs(world); world = runPipes(world);
    expect(world.storages[0].stored).toEqual({iron: 5, water: 5});
    expect(world.conveyors.flatMap(belt => belt.carrying).reduce((sum, item) => sum + item.amount, 0)).toBe(1);
    expect(world.pipes![0].water).toBe(1);
    expect(runStorageOutputs(world).storages[0].stored.iron).toBe(5);
    expect(runPipes(world).storages[0].stored.water).toBe(5);
  });

  it("validates regulation commands, freezes finalized settings and preserves fractional credits in saves", () => {
    const game = new GameEngine(createTestWorld());
    game.placeConveyor(0, 0, "right", "splitter"); game.placeStorage(1, 0);
    const belt = game.getWorld().conveyors[0], storage = game.getWorld().storages[0];
    expect(game.setConveyorRegulation(belt.id, 3, "left")).toBe(true);
    for (const rate of [0, -1, 11, 1.4, NaN]) expect(game.setConveyorRegulation(belt.id, rate)).toBe(false);
    expect(game.setStorageReserve(storage.id, 5)).toBe(true);
    expect(game.setStorageReserve(storage.id, storage.capacity + 1)).toBe(false);
    expect(game.setStorageReserve(storage.id, -1)).toBe(false);
    let world = game.getWorld(); world.conveyors[0].outputCredit = 0.6;
    const loaded = restoreWorld(serializeWorld(world));
    expect(loaded.conveyors[0]).toMatchObject({outputRate: 3, outputCredit: 0.6, priorityPort: "left"});
    expect(loaded.storages[0].reserveThreshold).toBe(5);
    const resume = limitedWorld(3); runConveyors(resume);
    const restored = restoreWorld(serializeWorld(resume));
    for (let tick = 0; tick < 9; tick++) { runConveyors(resume); runConveyors(restored); }
    expect(restored.conveyors).toEqual(resume.conveyors);
    expect(restored.storages).toEqual(resume.storages);
    expect(restored.storages[0].stored.iron).toBe(3);
    world.campaign.levels[0].status = "completed";
    const finalized = new GameEngine(world); finalized.finalizeLevel("level-1");
    expect(finalized.setConveyorRegulation(belt.id, 4)).toBe(false);
    expect(finalized.setStorageReserve(storage.id, 0)).toBe(false);
    // Old saves have no settings: their unrestricted behavior is preserved.
    world = limitedWorld(); runConveyors(world);
    expect(world.storages[0].stored.iron).toBe(100);
  });

  it("keeps limiter settings when rotating a cached network and redirects only to the new output", () => {
    const game = new GameEngine(limitedWorld(3));
    game.tick(); game.tick();
    expect(game.placeConveyor(0, 0, "down")).toBe(true);
    expect(game.placeStorage(0, 1)).toBe(true);
    game.tick(); game.tick();
    const world = game.getWorld();
    expect(world.conveyors[0]).toMatchObject({outputRate: 3, direction: "down"});
    expect(world.storages.find(storage => storage.x === 1)!.stored.iron ?? 0).toBe(0);
    expect(world.storages.find(storage => storage.y === 1)!.stored.iron).toBe(1);
    expect(world.conveyors[0].carrying[0].amount).toBe(99);
  });
});

describe("Alternative recipes", () => {
  it.each(["washed-iron", "direct-steel", "efficient-wire"] as RecipeId[])("consumes the defined inputs, preserves leftovers and accounts actual emissions for %s", id => {
    const recipe = RECIPES[id], game = new GameEngine(createTestWorld());
    game.placeMachine(0, 0, id === "efficient-wire" ? "assembler" : "iron-smelter");
    const machineId = game.getWorld().machines[0].id;
    expect(game.selectMachineRecipe(machineId, id)).toBe(true);
    let world = game.getWorld();
    world.machines[0].x = 45; world.machines[0].y = 55;
    world.machines[0].buffer = {...recipe.inputs};
    world.machines[0].progress = recipe.duration - 1;
    world.campaign.pollution = 10;
    world = runProduction(world);
    for (const resource of Object.keys(recipe.inputs)) expect(world.machines[0].buffer[resource as keyof typeof recipe.inputs]).toBe(0);
    for (const [resource, amount] of Object.entries(recipe.outputs)) expect(world.machines[0].buffer[resource as keyof typeof recipe.outputs]).toBe(amount);
    const base = id === "efficient-wire" ? 1.5 : 2;
    expect(world.campaign.levels[0].pollution).toBeCloseTo(base * recipe.pollutionMultiplier!);
    expect(world.campaign.pollution).toBeCloseTo(10 + base * recipe.pollutionMultiplier! - 0.02);
    const changed = new GameEngine(world);
    expect(changed.selectMachineRecipe(machineId, id === "efficient-wire" ? "copper-wire" : "iron-smelting")).toBe(true);
    expect(changed.getWorld().machines[0].buffer).toEqual(world.machines[0].buffer);
    const loaded = restoreWorld(serializeWorld(world));
    expect(loaded.machines[0].recipeId).toBe(id);
    expect(loaded.machines[0].buffer).toEqual(world.machines[0].buffer);
  });

  it("requires the campaign unlock, resets progress without losing ingredients and refuses finalized recipe changes", () => {
    const world = createTestWorld(); world.campaign.levels[1].status = "locked";
    const game = new GameEngine(world); game.placeMachine(0, 0, "iron-smelter");
    const id = game.getWorld().machines[0].id;
    expect(game.selectMachineRecipe(id, "washed-iron")).toBe(false);
    const unlocked = game.getWorld(); unlocked.campaign.levels[1].status = "active";
    unlocked.machines[0].buffer = {iron: 4, coal: 3, water: 2}; unlocked.machines[0].progress = 12;
    const next = new GameEngine(unlocked);
    expect(next.selectMachineRecipe(id, "washed-iron")).toBe(true);
    expect(next.getWorld().machines[0]).toMatchObject({progress: 0, buffer: {iron: 4, coal: 3, water: 2}});
    const finalized = next.getWorld(); finalized.campaign.levels[0].status = "finalized";
    expect(new GameEngine(finalized).selectMachineRecipe(id, "direct-steel")).toBe(false);
  });
});

describe("Ecological restoration", () => {
  it("retains the initial global absorption and differentiates island contributions", () => {
    const world = createTestWorld();
    expect(naturalAbsorption(world.campaign)).toBeCloseTo(0.02);
    expect(islandAbsorption(world.campaign, "level-1")).toBeGreaterThan(islandAbsorption(world.campaign, "level-4"));
    world.campaign.levels.forEach(level => {level.status = "locked";});
    expect(naturalAbsorption(world.campaign)).toBeCloseTo(0.02);
  });

  it("reserves water delivered by pipe and releases it through pipes after cancellation", () => {
    const game = new GameEngine(createTestWorld());
    game.placeStorage(2, 2, "shipping-depot"); game.placePipe(1, 2, "right"); game.placePipe(3, 2, "right");
    game.acceptContract("restore-marsh"); game.assignContract(game.getWorld().storages[0].id, "restore-marsh");
    let world = game.getWorld(); world.pipes![0].water = 1;
    world = runPipes(world);
    expect(world.storages[0].stored.water).toBe(1);
    world = runPipes(world);
    expect(world.pipes![1].water).toBe(0);
    const cancelled = new GameEngine(world); expect(cancelled.cancelContract("restore-marsh")).toBe(true);
    const released = runPipes(cancelled.getWorld());
    expect(released.storages[0].stored.water).toBe(0);
    expect(released.pipes![1].water).toBe(1);
    expect(naturalAbsorption(released.campaign)).toBeCloseTo(0.02);
  });

  it("consumes a distributed restoration exactly once, persists its bonus and cannot farm materials", () => {
    const game = new GameEngine(createTestWorld());
    game.placeStorage(1, 0, "shipping-depot"); game.placeStorage(3, 0, "shipping-depot");
    game.acceptContract("restore-marsh");
    for (const depot of game.getWorld().storages) game.assignContract(depot.id, "restore-marsh");
    const world = game.getWorld();
    world.campaign.levels[0].pollution = 50;
    world.storages[0].stored = {ironPlate: 10, water: 15}; world.storages[1].stored = {ironPlate: 10, water: 16};
    const materials = world.campaign.constructionMaterials;
    expect(runContracts(world)).toBe(true);
    expect(world.storages[0].stored).toEqual({ironPlate: 0, water: 0});
    expect(world.storages[1].stored).toEqual({ironPlate: 0, water: 1});
    expect(world.campaign.constructionMaterials).toBe(materials);
    expect(naturalAbsorption(world.campaign)).toBeCloseTo(0.023);
    expect(world.campaign.levels[0].pollution).toBe(50);
    expect(runContracts(world)).toBe(false);
    const loaded = restoreWorld(serializeWorld(world));
    expect(naturalAbsorption(loaded.campaign)).toBeCloseTo(0.023);
    expect(new GameEngine(loaded).acceptContract("restore-marsh")).toBe(false);
    loaded.campaign.pollution = 1;
    expect(runProduction(loaded).campaign.pollution).toBeCloseTo(0.977);
    expect(runProduction(loaded).campaign.levels[0].pollution).toBe(50);
  });
});
