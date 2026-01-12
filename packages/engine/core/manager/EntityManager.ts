import {isMachineType, Machine, MachineType} from "../../models/Machine";
import {World} from "../../models/World";
import type {ResourcesType} from "../../models/Resources";
import {MACHINE_CAPACITY, MACHINE_SPRITE_SHEET} from "../../config/machineConfig";
import {EntityManagerType} from "./EntityManager.type";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";
import {isStorageType} from "@engine/models/Storage.ts";
import {isConveyorType} from "@engine/models/Conveyor.ts";

class EntityManager implements EntityManagerType {
  placeMachine(x: number, y: number, type: MachineType, world: World): World | false {
    const {grid, machines} = world;
    if (!grid) throw new Error("Le monde n'a pas de grille définie.");
    
    try {
      const canPlace = grid.canPlaceMachine({x, y}, type, world);
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
        spriteName: MACHINE_SPRITE_SHEET[type],
        entityType: 'machine',
        efficiency: 1,
        production: 1
      }
      world = {
        ...world,
        machines: [...machines, newMachine]
      }
      return world
    } catch {
      console.error(`Une erreur est survenu lors du placement de la machine ${type}`)
      return false;
    }
  }
  placeConveyor(x: number, y: number, direction: DirectionType, world: World): World | false {
    const {grid, conveyors} = world;
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
        entityType: 'conveyor',
        speed: 0.2,
        carrying: [],
        capacity: 3
      }
      world = {
        ...world,
        conveyors: [...conveyors, conveyor]
      }
      return world;
    } catch(e) {
      console.error("Une erreur est survenu lors du placement du convoyeur", e)
      return false
    }
  }
  
  placeStorage(x: number, y: number, world: World): World | false {
    const {grid, storages} = world;
    if (!grid) throw new Error("Le monde n'a pas de grille définie.");
    
    try {
      const success = grid.occupy({x, y});
      if (!success) return false;
      const storage: Storage = {
        x,
        y,
        id: crypto.randomUUID(),
        capacity: 200,
        stored: {} as Record<ResourcesType, number>,
        entityType: 'storage'
      }
      world = {
        ...world,
        storages: [...storages, storage]
      }
      return world
    } catch (e) {
      console.error(`Une erreur est survenu lors de l'ajout du stockage ${e.message}`)
      return false
    }
  }
  
  destroyEntityAt(x: number, y: number, world: World): World {
    const entity = this.getEntityAt(x, y, world);
    if (!entity) return world;
    if (!world.grid) return world;
    world.grid.free({x, y});
    
    if (isStorageType(entity)) {
      const storages = this.removeStorage(entity.id, world);
      return {
        ...world,
        storages
      }
    }
    if (isMachineType(entity)) {
      const machines = this.removeMachine(entity.id, world);
      return {
        ...world,
        machines
      }
    }
    if (isConveyorType(entity)) {
      const conveyors = this.removeConveyor(entity.id, world);
      return {
        ...world,
        conveyors
      }
    }
    return world;
  }
  
  private getEntityAt(x: number, y: number, world: World): BaseEntity | null {
    const findFn = (e) => e.x === x && e.y === y;
    const storage = world.storages.find(findFn);
    if (storage) return storage;
    const machine = world.machines.find(findFn);
    if (machine) return machine;
    const conveyor = world.conveyors.find(findFn);
    if (conveyor) return conveyor;
    return null;
  }
  private removeConveyor(id: string, world: World): Conveyor[] {
    const {conveyors} = world;
    return conveyors.filter(c => c.id !== id);
  }
  
  private removeMachine(id: string, world: World) {
    const {machines} = world;
    return machines.filter(e => e.id !== id);
  }
  
  private removeStorage(id: string, world: World): Storage[] {
    const {storages} = world;
    return storages.filter(m => m.id !== id);
  }
  
}

export const entityManager = new EntityManager();