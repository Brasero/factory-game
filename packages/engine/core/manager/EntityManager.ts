import {isMachineType} from "../../models/Machine";
import type {Machine, MachineType, MachineVariant} from "@engine/models/Machine";
import type {World} from "../../models/World";
import type {ResourcesType} from "../../models/Resources";
import {MACHINE_CAPACITY, MACHINE_SPRITE_SHEET} from "../../config/machineConfig";
import type {EntityManagerType} from "./EntityManager.type";
import type {Conveyor, ConveyorTier, DirectionType} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";
import {isStorageType} from "@engine/models/Storage.ts";
import {isConveyorType} from "@engine/models/Conveyor.ts";
import type {Position} from "@engine/models/Position.ts";
import {MACHINE_VARIANTS} from "@engine/config/machineConfig";
import type {Pipe} from "@engine/models/Pipe";
import {isPipe} from "@engine/models/Pipe";

class EntityManager implements EntityManagerType {
  placeMachine(x: number, y: number, type: MachineType, world: World, variant: MachineVariant = "standard"): World | false {
    const {grid, machines} = world;
    if (!grid) throw new Error("Le monde n'a pas de grille définie.");
    
    try {
      const canPlace = grid.canPlaceMachine({x, y}, type);
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
        spriteName: (type === "iron-mine" || type === "coal-mine" || type === "copper-mine") && variant === "eco"
          ? "miner1" : MACHINE_SPRITE_SHEET[type],
        entityType: 'machine',
        efficiency: MACHINE_VARIANTS[variant].speed,
        production: MACHINE_VARIANTS[variant].production,
        variant
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
  placePipe(x: number, y: number, direction: DirectionType, world: World): World | false {
    const {grid} = world;
    if (!grid) throw new Error("Le monde n'a pas de grille définie.");
    const existing = world.pipes.find(pipe => pipe.x === x && pipe.y === y);
    if (existing) return {...world, pipes: world.pipes.map(pipe => pipe === existing ? {...pipe, direction} : pipe)};
    if (!grid.canPlaceMachine({x, y}, "conveyor")) return false;
    if (!grid.occupy({x, y})) return false;
    const pipe: Pipe = {id: crypto.randomUUID(), x, y, entityType: "pipe", direction, water: 0, capacity: 10};
    return {...world, pipes: [...world.pipes, pipe]};
  }
  placeConveyor(x: number, y: number, direction: DirectionType, world: World, type: Conveyor["type"] = "conveyor", tier?: ConveyorTier): World | false {
    const {grid, conveyors} = world;
    if (!grid) throw new Error("Le monde n'a pas de grille définie.")
    
    try {
      const hasBlockingEntity =
        world.machines.some(m => m.x === x && m.y === y) ||
        world.storages.some(s => s.x === x && s.y === y);
      if (hasBlockingEntity) return false;

      const existingConveyor = conveyors.find(c => c.x === x && c.y === y);

      if (existingConveyor) {
        const canUpgrade = existingConveyor.type === "conveyor" && (type === "splitter" || type === "merger");
        if (existingConveyor.type !== type && !canUpgrade) return false;
        const updated: Conveyor = {
          ...existingConveyor,
          direction,
          type,
          tier: type === "conveyor" ? tier ?? existingConveyor.tier ?? 1 : undefined,
          routingCursor: canUpgrade ? 0 : existingConveyor.routingCursor
        };
        return {
          ...world,
          conveyors: conveyors.map(conveyor => conveyor === existingConveyor ? updated : conveyor)
        };
      }

      if (!grid.canPlaceMachine({x, y}, "conveyor")) return false;
      const success = grid.occupy({x,y})
      if (!success) return false;
      const conveyor: Conveyor = {
        id: crypto.randomUUID(),
        x,
        y,
        type,
        tier: type === "conveyor" ? tier ?? 1 : undefined,
        routingCursor: 0,
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
      if (!grid.canPlaceMachine({x, y}, "storage")) return false;
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
      console.error(`Une erreur est survenu lors de l'ajout du stockage ${e}`)
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
    if (isPipe(entity)) return {...world, pipes: world.pipes.filter(pipe => pipe.id !== entity.id)};
    return world;
  }
  
  private getEntityAt(x: number, y: number, world: World): BaseEntity | null {
    const findFn = (e: Position) => e.x === x && e.y === y;
    const storage = world.storages.find(findFn);
    if (storage) return storage;
    const machine = world.machines.find(findFn);
    if (machine) return machine;
    const conveyor = world.conveyors.find(findFn);
    if (conveyor) return conveyor;
    const pipe = world.pipes.find(findFn);
    if (pipe) return pipe;
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
