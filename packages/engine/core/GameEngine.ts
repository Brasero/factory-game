import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import type {SelectedItem} from "@engine/api/types";
import {buildNetworkTopology, type NetworkTopology} from "@engine/systems/NetworkTopology";
import type {World} from "@engine/models/World.ts";
import {runProduction} from "@engine/systems/ProductionSystem.ts";
import type {MachineType} from "@engine/models/Machine.ts";
import {runConveyors} from "@engine/systems/ConveyorSystem.ts";
import {runOutputMachine} from "@engine/systems/MachineOutputSystem.ts";
import {runStorageOutputs} from "@engine/systems/StorageOutputSystem.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {EntityManagerType} from "@engine/core/manager/EntityManager.type.ts";
import {entityManager} from "@engine/core/manager/EntityManager.ts";

export class GameEngine {
    private network?: NetworkTopology;
    #world: World
    private entityManager: EntityManagerType;
    constructor(world: World) {
        this.#world = copyWorld(world);
        this.entityManager = entityManager;
    }
    
    tick() {
        this.network ??= buildNetworkTopology(this.#world);
        this.#world = runStorageOutputs(this.#world);
        this.#world = runProduction(this.#world);
        this.#world = runOutputMachine(this.#world, this.network);
        runConveyors(this.#world, this.network);
        this.updateResourceTotals();
        this.#world.tick += 1;
    }
    
    private updateResourceTotals() {
        this.#world.resources = {iron: 0, coal: 0, water: 0, ironPlate: 0};
        for (const storage of this.#world.storages) {
            for (const resource of ["iron", "coal", "water", "ironPlate"] as const) {
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

    canPlaceMachine(x: number, y: number, machineType: SelectedItem): boolean {
        const world = this.#world;
        if (machineType === "conveyor" || machineType === "splitter" || machineType === "merger") {
            const blocked = world.machines.some(m => m.x === x && m.y === y) ||
                world.storages.some(s => s.x === x && s.y === y);
            if (blocked) return false;
            const existing = world.conveyors.find(c => c.x === x && c.y === y);
            if (existing) return existing.type === machineType;
        }
        return world.grid?.canPlaceMachine({x, y}, machineType) ?? false;
    }

    placeMachine(x: number, y: number, type: MachineType) {
        const {grid} = this.#world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            const updatedWorld = this.entityManager.placeMachine(x, y, type, this.#world);
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
        this.network = undefined;
        const updatedWorld = this.entityManager.destroyEntityAt(x, y, this.#world);
        this.#world = {
            ...updatedWorld
        }
        this.updateResourceTotals();
    }
}
function copyWorld(world: World): World {
    const {grid, ...state} = world;
    return {...structuredClone(state), grid: grid?.clone()};
}
