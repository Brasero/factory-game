import {World} from "@engine/models/World.ts";
import {runProduction} from "@engine/systems/ProductionSystem.ts";
import type {Machine, MachineType} from "@engine/models/Machine.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {runConveyors} from "@engine/systems/ConveyorSystem.ts";
import {runOutputMachine} from "@engine/systems/MachineOutputSystem.ts";
import {MACHINE_CAPACITY, MACHINE_SPRITE_SHEET} from "@engine/config/machineConfig.ts";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";
import {isStorageType} from "@engine/models/Storage.ts";
import {isMachineType} from "@engine/models/Machine.ts";
import {isConveyorType} from "@engine/models/Conveyor.ts";

export class GameEngine {
    public world: World
    constructor(world: World) {
        this.world = world
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
                y,
                capacity: MACHINE_CAPACITY[type],
                progress: 0,
                active: false,
                spriteName: MACHINE_SPRITE_SHEET[type]
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
    
    placeConveyor(x: number, y: number, direction: DirectionType, capacity: number): boolean {
        const {grid, conveyors} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.")
        
        try {
            const success = grid.occupy({x,y})
            if (!success) return false;
            const conveyor: Conveyor = {
                id: crypto.randomUUID(),
                x,
                y,
                type: "conveyor",
                direction,
                capacity,
                buffer: {} as Record<ResourcesType, number>,
                active: false,
                progress: 0
            }
            this.world = {
                ...this.world,
                conveyors: [...conveyors, conveyor]
            }
            return true
        } catch(e) {
            console.error("Une erreur est survenu lors du placement du convoyeur", e)
            return false
        }
    }
    
    placeStorage(x: number, y: number) {
        const {grid, storages} = this.world;
        if (!grid) throw new Error("Le monde n'a pas de grille définie.");
        
        try {
            const success = grid.occupy({x, y});
            if (!success) return false;
            const storage: Storage = {
                x,
                y,
                id: crypto.randomUUID(),
                capacity: 200,
                stored: {} as Record<ResourcesType, number>
            }
            this.world = {
                ...this.world,
                storages: [...storages, storage]
            }
            return true
        } catch (e) {
            console.error(`Une erreur est survenu lors de l'ajout du stockage ${e.message}`)
            return false
        }
    }

    getEntityAt(x: number, y: number): Storage | Machine | Conveyor | null {
        const findFn = (e) => e.x === x && e.y === y
        const storage = this.world.storages.find(findFn)
        if (storage) return storage;
        const machine = this.world.machines.find(findFn)
        if (machine) return machine
        const conveyor = this.world.conveyors.find(findFn)
        if (conveyor) return conveyor;
        return null
    }
    destroyEntityAt(x: number, y: number) {
        const entity = this.getEntityAt(x, y)
        if (!entity) return;
        if (!this.world.grid) return;
        this.world.grid.free({x, y})

        if (isStorageType(entity)) {
            this.removeStorage(entity.id)
            return
        }
        if (isMachineType(entity)){
            this.removeMachine(entity.id)
            return
        }
        if (isConveyorType(entity)) {
            this.removeConveyor(entity.id)
            return
        }
    }

    removeMachine(id: string) {
        const { machines } = this.world
        const filteredMachine = machines.filter((m) => m.id !== id);
        this.world = {
            ...this.world,
            machines: filteredMachine
        }
    }

    removeConveyor(id: string) {
        const { conveyors } = this.world
        const filteredConveyor = conveyors.filter(c => c.id !== id)
        this.world = {
            ...this.world,
            conveyors: filteredConveyor
        }
    }

    removeStorage(id:string) {
        const { storages } = this.world;
        const filteredStorage = storages.filter(s => s.id !== id)
        this.world = {
            ...this.world,
            storages: filteredStorage
        }
    }
}