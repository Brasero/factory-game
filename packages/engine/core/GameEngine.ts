import {World} from "@engine/models/World.ts";
import {runProduction} from "@engine/systems/ProductionSystem.ts";
import type {Machine, MachineType} from "@engine/models/Machine.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {runConveyors} from "@engine/systems/ConveyorSystem.ts";

export class GameEngine {
    public world: World
    constructor(world: World) {
        this.world = world
    }

    tick() {
        this.world = runProduction(this.world);
        runConveyors(this.world);
        this.world.tick += 1;
    }

    getWorld() {
        return this.world;
    }
    
    placeMachine(x: number, y: number, type: MachineType) {
        const {grid, machines} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            const canPlace = grid.canPlaceMachine({x, y}, type, this.world);
            if (!canPlace) return false;
            const success = grid.occupy({x, y})// Marque la case comme occupée
            if (!success) return false;
            const newMachine: Machine = {
                id: crypto.randomUUID(),
                buffer: {} as Record<ResourcesType, number>,
                type,
                x,
                y
            }
            this.world = {
                ...this.world,
                machines: [...machines, newMachine]
            }
        } catch {
            console.error(`Une erreur est survenu lors du placement de la machine ${type}`)
            return false;
        }
        return true;
    }
}