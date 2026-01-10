import {World} from "@engine/models/World.ts";
import {runProduction} from "@engine/systems/ProductionSystem.ts";
import type {MachineType} from "@engine/models/Machine.ts";
import {runConveyors} from "@engine/systems/ConveyorSystem.ts";
import {runOutputMachine} from "@engine/systems/MachineOutputSystem.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {EntityManagerType} from "@engine/core/manager/EntityManager.type.ts";
import {entityManager} from "@engine/core/manager/EntityManager.ts";

export class GameEngine {
    public world: World
    private entityManager: EntityManagerType;
    constructor(world: World) {
        this.world = world
        this.entityManager = entityManager;
    }
    
    tick() {
        this.world = runProduction(this.world);
        this.world = runOutputMachine(this.world);
        runConveyors(this.world);
        this.world.tick += 1;
    }
    
    getWorld() {
        return this.world;
    }
    
    placeMachine(x: number, y: number, type: MachineType) {
        const {grid} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            const updatedWorld = this.entityManager.placeMachine(x, y, type, this.world);
            if (!updatedWorld) {
                return false
            }
            this.world = {
                ...updatedWorld,
            }
        } catch {
            console.error(`Une erreur est survenu lors du placement de la machine ${type}`)
            return false;
        }
        return true;
    }
    
    placeConveyor(x: number, y: number, direction: DirectionType): boolean {
        const {grid} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.")
        
        try {
            const updatedWorld = this.entityManager.placeConveyor(x, y, direction, this.world);
            if (!updatedWorld) return false;
            this.world = {
                ...updatedWorld
            }
            return true
        } catch(e) {
            console.error("Une erreur est survenu lors du placement du convoyeur", e)
            return false
        }
    }
    
    placeStorage(x: number, y: number) {
        const {grid} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            const updatedWorld = this.entityManager.placeStorage(x, y, this.world);
            if (!updatedWorld) return false;
            this.world = {
                ...updatedWorld,
            }
            return true
        } catch (e) {
            console.error(`Une erreur est survenu lors de l'ajout du stockage ${e.message}`)
            return false
        }
    }
    
    destroyEntityAt(x: number, y: number) {
        const updatedWorld = this.entityManager.destroyEntityAt(x, y, this.world);
        this.world = {
            ...updatedWorld
        }
    }
}