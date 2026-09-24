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
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {EntityManagerType} from "@engine/core/manager/EntityManager.type.ts";
import {entityManager} from "@engine/core/manager/EntityManager.ts";
import {MACHINE_RECIPE_OPTIONS, RECIPES, recipeInputs, type RecipeId} from "@engine/config/recipeConfig";

export class GameEngine {
    private network?: NetworkTopology;
    #world: World
    private entityManager: EntityManagerType;
    constructor(world: World) {
        this.#world = copyWorld(world);
        this.entityManager = entityManager;
    }
    
    tick() {
        if (this.#world.campaign.status !== "playing") return;
        this.network ??= buildNetworkTopology(this.#world);
        this.#world = runStorageOutputs(this.#world);
        this.#world = runProduction(this.#world);
        this.#world = runOutputMachine(this.#world, this.network);
        runConveyors(this.#world, this.network);
        this.#world = runTunnels(this.#world);
        this.updateResourceTotals();
        this.#world = runCampaign(this.#world);
        this.#world.tick += 1;
    }
    
    private updateResourceTotals() {
        this.#world.resources = emptyResources();
        for (const storage of this.#world.storages) {
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

    canPlaceMachine(x: number, y: number, machineType: SelectedItem, variant: MachineVariant = "standard"): boolean {
        const world = this.#world;
        if (world.campaign.status !== "playing") return false;
        const level = campaignLevelAt(x, y) ?? CAMPAIGN_LEVELS.find(item => item.id === world.campaign.activeLevelId);
        const progress = world.campaign.levels.find(item => item.id === level?.id);
        if (!level || !progress || progress.status === "locked" || progress.status === "finalized") return false;
        if (world.tunnels.some(tunnel => tunnel.x === x && tunnel.y === y)) return false;
        const unlockedLevels = CAMPAIGN_LEVELS.filter(definition => world.campaign.levels.find(item => item.id === definition.id)?.status !== "locked");
        const actualType = machineType === "miner" ? undefined : machineType;
        if (actualType && !["conveyor", "splitter", "merger", "storage"].includes(actualType) &&
            !unlockedLevels.some(definition => definition.unlocks.machines.includes(actualType as MachineType))) return false;
        const usesVariant = machineType === "miner" ||
            (actualType !== undefined && !["conveyor", "splitter", "merger", "storage"].includes(actualType));
        if (usesVariant && !unlockedLevels.some(definition => definition.unlocks.variants.includes(variant))) return false;
        if (machineType === "conveyor" || machineType === "splitter" || machineType === "merger") {
            const blocked = world.machines.some(m => m.x === x && m.y === y) ||
                world.storages.some(s => s.x === x && s.y === y);
            if (blocked) return false;
            const existing = world.conveyors.find(c => c.x === x && c.y === y);
            if (existing) return existing.type === machineType ||
                (existing.type === "conveyor" && (machineType === "splitter" || machineType === "merger"));
        }
        return world.grid?.canPlaceMachine({x, y}, machineType) ?? false;
    }

    placeMachine(x: number, y: number, type: MachineType, variant: MachineVariant = "standard") {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            if (!this.canPlaceMachine(x, y, type, variant)) return false;
            const updatedWorld = this.entityManager.placeMachine(x, y, type, this.#world, variant);
            if (!updatedWorld) {
                return false
            }
            this.network = undefined;
            this.#world = {
                ...updatedWorld,
            }
        } catch {
            console.error(`Une erreur est survenu lors du placement de la machine ${type}`)
            return false;
        }
        return true;
    }
    
    placeConveyor(x: number, y: number, direction: DirectionType, type: "conveyor" | "splitter" | "merger" = "conveyor"): boolean {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.")
        
        try {
            if (!this.canPlaceMachine(x, y, type)) return false;
            const updatedWorld = this.entityManager.placeConveyor(x, y, direction, this.#world, type);
            if (!updatedWorld) return false;
            this.network = undefined;
            this.#world = {
                ...updatedWorld
            }
            return true
        } catch(e) {
            console.error("Une erreur est survenu lors du placement du convoyeur", e)
            return false
        }
    }
    
    placeStorage(x: number, y: number) {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            if (!this.canPlaceMachine(x, y, "storage")) return false;
            const updatedWorld = this.entityManager.placeStorage(x, y, this.#world);
            if (!updatedWorld) return false;
            this.network = undefined;
            this.#world = {
                ...updatedWorld,
            }
            return true
        } catch (e) {
            console.error(`Une erreur est survenu lors de l'ajout du stockage ${e}`)
            return false
        }
    }
    
    destroyEntityAt(x: number, y: number) {
        const definition = campaignLevelAt(x, y) ?? CAMPAIGN_LEVELS.find(item => item.id === this.#world.campaign.activeLevelId);
        const progress = this.#world.campaign.levels.find(item => item.id === definition?.id);
        if (!progress || progress.status === "locked" || progress.status === "finalized") return false;
        this.network = undefined;
        const updatedWorld = this.entityManager.destroyEntityAt(x, y, this.#world);
        this.#world = {
            ...updatedWorld
        }
        this.updateResourceTotals();
        return true;
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
