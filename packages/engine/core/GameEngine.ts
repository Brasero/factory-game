import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import type {SelectedItem} from "@engine/api/types";
import {buildNetworkTopology, type NetworkTopology} from "@engine/systems/NetworkTopology";
import type {World} from "@engine/models/World.ts";
import {runProduction} from "@engine/systems/ProductionSystem.ts";
import type {MachineType} from "@engine/models/Machine.ts";
import {runConveyors} from "@engine/systems/ConveyorSystem.ts";
import {runOutputMachine} from "@engine/systems/MachineOutputSystem.ts";
import {runStorageOutputs} from "@engine/systems/StorageOutputSystem.ts";
import {runTunnels} from "@engine/systems/TunnelSystem";
import {runCampaign} from "@engine/systems/CampaignSystem";
import {CAMPAIGN_LEVELS, campaignLevelAt} from "@engine/config/campaignConfig";
import {emptyResources, RESOURCE_TYPES} from "@engine/models/Resources";
import type {MachineVariant} from "@engine/models/Machine";
import type {Conveyor, DirectionType, SmartSplitterFilter, SmartSplitterPort} from "@engine/models/Conveyor.ts";
import type {EntityManagerType} from "@engine/core/manager/EntityManager.type.ts";
import {entityManager} from "@engine/core/manager/EntityManager.ts";
import {MACHINE_RECIPE_OPTIONS, RECIPES, recipeInputs, type RecipeId} from "@engine/config/recipeConfig";
import {runPipes} from "@engine/systems/PipeSystem";
import type {Position} from "@engine/models/Position";
import {CONSTRUCTION_REFUND_RATIO, constructionCost} from "@engine/config/constructionConfig";
import {machineFootprintCells, machineOccupies} from "@engine/config/machineFootprint";

export class GameEngine {
    private network?: NetworkTopology;
    #world: World
    private entityManager: EntityManagerType;
    constructor(world: World) {
        this.#world = copyWorld(world);
        this.entityManager = entityManager;
        this.updateResourceTotals();
    }
    
    tick() {
        if (this.#world.campaign.status !== "playing") return;
        this.network ??= buildNetworkTopology(this.#world);
        this.#world = runStorageOutputs(this.#world);
        this.#world = runProduction(this.#world);
        this.#world = runOutputMachine(this.#world, this.network);
        runConveyors(this.#world, this.network);
        for (const belt of this.#world.conveyors) {
            const count = belt.transported ?? 0;
            const flow = belt.flow ??= {tick: this.#world.tick, baseline: count, rate: 0};
            const elapsed = this.#world.tick - flow.tick;
            if (elapsed >= 100) {
                flow.rate = (count - flow.baseline) * 10 / elapsed;
                flow.tick = this.#world.tick;
                flow.baseline = count;
            }
        }
        this.#world = runPipes(this.#world);
        this.#world = runTunnels(this.#world);
        this.updateResourceTotals();
        this.#world = runCampaign(this.#world);
        this.#world.tick += 1;
    }
    
    private updateResourceTotals() {
        this.#world.resources = emptyResources();
        for (const storage of [...this.#world.storages, ...this.#world.tunnels]) {
            for (const resource of RESOURCE_TYPES) {
                this.#world.resources[resource] += storage.stored[resource] ?? 0;
            }
        }
    }

    // Detached diagnostic/export copy. Use getSnapshot for frequent rendering reads.
    getWorld(): World {
        return copyWorld(this.#world);
    }
    
    getSnapshot() {
        return buildWorldSnapshot(this.#world);
    }

    private placementCost(x: number, y: number, item: SelectedItem, variant: MachineVariant = "standard") {
        if (item === "pipe" && this.#world.pipes.some(pipe => pipe.x === x && pipe.y === y)) return 0;
        const conveyor = this.#world.conveyors.find(entity => entity.x === x && entity.y === y);
        if (conveyor && ["conveyor", "splitter", "smart-splitter", "merger"].includes(item)) {
            if (conveyor.type === item) return 0;
            return Math.max(0, constructionCost(item, variant) - constructionCost(conveyor.type, variant));
        }
        return constructionCost(item, variant);
    }

    canPlaceMachine(x: number, y: number, machineType: SelectedItem, variant: MachineVariant = "standard"): boolean {
        const world = this.#world;
        if (world.campaign.status !== "playing") return false;
        const level = campaignLevelAt(x, y) ?? CAMPAIGN_LEVELS.find(item => item.id === world.campaign.activeLevelId);
        const progress = world.campaign.levels.find(item => item.id === level?.id);
        if (!level || !progress || progress.status === "locked" || progress.status === "finalized") return false;
        if (world.campaign.constructionMaterials < this.placementCost(x, y, machineType, variant)) return false;
        const unlockedLevels = CAMPAIGN_LEVELS.filter(definition => world.campaign.levels.find(item => item.id === definition.id)?.status !== "locked");
        const actualType = machineType === "miner" ? undefined : machineType;
        if (actualType && !["conveyor", "splitter", "smart-splitter", "merger", "pipe", "storage"].includes(actualType) &&
            !unlockedLevels.some(definition => definition.unlocks.machines.includes(actualType as MachineType))) return false;
        const usesVariant = machineType === "miner" ||
            (actualType !== undefined && !["conveyor", "splitter", "smart-splitter", "merger", "pipe", "storage"].includes(actualType));
        if (usesVariant && !unlockedLevels.some(definition => definition.unlocks.variants.includes(variant))) return false;
        const isMachine = actualType !== undefined && !["conveyor", "splitter", "smart-splitter", "merger", "pipe", "storage"].includes(actualType);
        if (isMachine) {
            const footprint = machineFootprintCells({x, y, type: actualType as MachineType});
            if (footprint.some((cell, index) => {
                const cellLevel = campaignLevelAt(cell.x, cell.y) ?? level;
                const cellProgress = world.campaign.levels.find(item => item.id === cellLevel?.id);
                return !cellLevel || cellLevel.id !== level.id || !cellProgress || cellProgress.status === "locked" ||
                    cellProgress.status === "finalized" || world.tunnels.some(tunnel => tunnel.x === cell.x && tunnel.y === cell.y) ||
                    !world.grid?.canPlaceMachine(cell, index === 0 ? actualType : "machine");
            })) return false;
            return true;
        }
        if (world.tunnels.some(tunnel => tunnel.x === x && tunnel.y === y)) return false;
        if (machineType === "conveyor" || machineType === "splitter" || machineType === "smart-splitter" || machineType === "merger") {
            const blocked = world.machines.some(m => machineOccupies(m, {x, y})) ||
                world.storages.some(s => s.x === x && s.y === y);
            if (blocked) return false;
            const existing = world.conveyors.find(c => c.x === x && c.y === y);
            if (existing) return existing.type === machineType ||
                (existing.type === "conveyor" && (machineType === "splitter" || machineType === "smart-splitter" || machineType === "merger"));
        }
        if (machineType === "pipe") {
            if (!unlockedLevels.some(definition => definition.unlocks.machines.includes("water-pump"))) return false;
            if (world.machines.some(m => machineOccupies(m, {x, y})) || world.storages.some(s => s.x === x && s.y === y) ||
                world.conveyors.some(c => c.x === x && c.y === y)) return false;
            if (world.pipes.some(pipe => pipe.x === x && pipe.y === y)) return true;
        }
        return world.grid?.canPlaceMachine({x, y}, machineType) ?? false;
    }

    placeMachine(x: number, y: number, type: MachineType, variant: MachineVariant = "standard") {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            if (!this.canPlaceMachine(x, y, type, variant)) return false;
            const cost = this.placementCost(x, y, type, variant);
            const updatedWorld = this.entityManager.placeMachine(x, y, type, this.#world, variant);
            if (!updatedWorld) {
                return false
            }
            this.network = undefined;
            this.#world = {
                ...updatedWorld,
            }
            this.#world.campaign.constructionMaterials -= cost;
        } catch {
            console.error(`Une erreur est survenu lors du placement de la machine ${type}`)
            return false;
        }
        return true;
    }
    
    placeConveyor(x: number, y: number, direction: DirectionType, type: Conveyor["type"] = "conveyor", tier?: Conveyor["tier"]): boolean {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.")
        
        try {
            if (!this.canPlaceMachine(x, y, type)) return false;
            const cost = this.placementCost(x, y, type);
            const updatedWorld = this.entityManager.placeConveyor(x, y, direction, this.#world, type, tier);
            if (!updatedWorld) return false;
            this.network = undefined;
            this.#world = {
                ...updatedWorld
            }
            this.#world.campaign.constructionMaterials -= cost;
            return true
        } catch(e) {
            console.error("Une erreur est survenu lors du placement du convoyeur", e)
            return false
        }
    }

    setSmartSplitterFilter(id: string, port: SmartSplitterPort, filter: SmartSplitterFilter): boolean {
        const index = this.#world.conveyors.findIndex(conveyor => conveyor.id === id && conveyor.type === "smart-splitter");
        if (index < 0) return false;
        const splitter = this.#world.conveyors[index];
        this.#world.conveyors[index] = {...splitter, outputFilters: {...splitter.outputFilters, [port]: filter}};
        return true;
    }

    placePipe(x: number, y: number, direction: DirectionType): boolean {
        if (!this.canPlaceMachine(x, y, "pipe")) return false;
        const cost = this.placementCost(x, y, "pipe");
        const updated = this.entityManager.placePipe(x, y, direction, this.#world);
        if (!updated) return false;
        this.#world = updated;
        this.#world.campaign.constructionMaterials -= cost;
        return true;
    }
    
    placeStorage(x: number, y: number) {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            if (!this.canPlaceMachine(x, y, "storage")) return false;
            const cost = this.placementCost(x, y, "storage");
            const updatedWorld = this.entityManager.placeStorage(x, y, this.#world);
            if (!updatedWorld) return false;
            this.network = undefined;
            this.#world = {
                ...updatedWorld,
            }
            this.#world.campaign.constructionMaterials -= cost;
            return true
        } catch (e) {
            console.error(`Une erreur est survenu lors de l'ajout du stockage ${e}`)
            return false
        }
    }
    
    destroyEntityAt(x: number, y: number) {
        return this.destroyEntitiesAt([{x, y}]);
    }

    destroyEntitiesAt(positions: Position[]) {
        const editable = new Map<string, Position>();
        for (const position of positions) {
            const definition = campaignLevelAt(position.x, position.y) ??
                CAMPAIGN_LEVELS.find(item => item.id === this.#world.campaign.activeLevelId);
            const progress = this.#world.campaign.levels.find(item => item.id === definition?.id);
            if (progress && progress.status !== "locked" && progress.status !== "finalized") {
                editable.set(`${position.x},${position.y}`, position);
            }
        }
        if (!editable.size) return false;

        const entityIds = new Set<string>();
        const entityCells = new Set<string>();
        let refund = 0;
        for (const entity of [...this.#world.machines, ...this.#world.conveyors, ...this.#world.pipes, ...this.#world.storages]) {
            const cells = entity.entityType === "machine" ? machineFootprintCells(entity) : [{x: entity.x, y: entity.y}];
            if (!cells.some(cell => editable.has(`${cell.x},${cell.y}`))) continue;
            entityIds.add(entity.id);
            cells.forEach(cell => entityCells.add(`${cell.x},${cell.y}`));
            const item = entity.entityType === "machine" ? entity.type
                : entity.entityType === "conveyor" ? entity.type
                : entity.entityType === "pipe" ? "pipe" : "storage";
            const variant = entity.entityType === "machine" ? entity.variant ?? "standard" : "standard";
            refund += Math.floor(constructionCost(item, variant) * CONSTRUCTION_REFUND_RATIO);
        }
        this.#world.campaign.constructionMaterials += refund;
        if (entityIds.size) {
            const keep = <T extends {id: string}>(entity: T) => !entityIds.has(entity.id);
            this.#world.machines = this.#world.machines.filter(keep);
            this.#world.conveyors = this.#world.conveyors.filter(keep);
            this.#world.pipes = this.#world.pipes.filter(keep);
            this.#world.storages = this.#world.storages.filter(keep);
            for (const key of entityCells) {
                const [cellX, cellY] = key.split(",").map(Number);
                this.#world.grid?.free({x: cellX, y: cellY});
            }
            this.network = undefined;
        }

        const levelThree = this.#world.campaign.levels.find(level => level.id === "level-3");
        const levelThreeUnlocked = !!levelThree && levelThree.status !== "locked";
        let decorationsRemoved = 0;
        if (levelThreeUnlocked) {
            for (const [key, position] of editable) {
                if (!entityCells.has(key) && this.#world.grid?.removeDecoration(position)) decorationsRemoved++;
            }
        }
        this.updateResourceTotals();
        return entityIds.size > 0 || decorationsRemoved > 0;
    }

    activateLevel(levelId: string): boolean {
        const level = this.#world.campaign.levels.find(item => item.id === levelId);
        if (!level || level.status === "locked") return false;
        this.#world.campaign.activeLevelId = levelId;
        return true;
    }

    finalizeLevel(levelId: string): boolean {
        const level = this.#world.campaign.levels.find(item => item.id === levelId);
        if (!level || level.status !== "completed") return false;
        level.status = "finalized";
        level.finalizedAt = this.#world.tick;
        if (this.#world.campaign.levels.every(item => item.status === "finalized")) this.#world.campaign.status = "finished";
        return true;
    }

    continueCampaign(): boolean {
        if (this.#world.campaign.status !== "finished") return false;
        this.#world.campaign.status = "playing";
        return true;
    }

    selectMachineRecipe(machineId: string, recipeId: RecipeId): boolean {
        const index = this.#world.machines.findIndex(machine => machine.id === machineId);
        if (index < 0) return false;
        const machine = this.#world.machines[index];
        if (!MACHINE_RECIPE_OPTIONS[machine.type]?.includes(recipeId)) return false;
        const recipeUnlocked = CAMPAIGN_LEVELS.some(level =>
            this.#world.campaign.levels.find(progress => progress.id === level.id)?.status !== "locked" &&
            level.unlocks.recipes.includes(recipeId));
        if (!recipeUnlocked) return false;
        if (machine.recipeId === recipeId) return true;

        const previousInputs = new Set(recipeInputs(machine).map(([resource]) => resource));
        const nextInputs = new Set(Object.keys(RECIPES[recipeId].inputs));
        const buffer = {...machine.buffer};
        for (const resource of previousInputs) {
            if (!nextInputs.has(resource)) buffer[resource] = 0;
        }
        this.#world.machines[index] = {...machine, recipeId, buffer, progress: 0, active: false};
        return true;
    }

    setMachinePaused(machineId: string, paused: boolean): boolean {
        const index = this.#world.machines.findIndex(machine => machine.id === machineId);
        if (index < 0) return false;
        const machine = this.#world.machines[index];
        this.#world.machines[index] = {...machine, paused, active: paused ? false : machine.active};
        return true;
    }
}
function copyWorld(world: World): World {
    const {grid, ...state} = world;
    return {...structuredClone(state), grid: grid?.clone()};
}
