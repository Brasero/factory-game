import {tunnelAllowsOutput} from "./TunnelFilters";
import type {DirectionType} from "@engine/models/Conveyor";
import {depotReserved} from "./ContractSystem";
import {machineInputSpace, recipeAcceptsResource} from "@engine/config/recipeConfig";
import type {ResourcesType} from "@engine/models/Resources";
import type {Storage} from "@engine/models/Storage";
import type {Tunnel} from "@engine/models/Tunnel";
import type {World} from "@engine/models/World";
import {acceptsInput, directions, nextPosition, positionKey} from "@engine/systems/NetworkTopology";
import {machineFootprintCells, machineOutputPosition} from "@engine/config/machineFootprint";

type StoredEntity = Storage | Tunnel;

function available(world: World, entity: StoredEntity, resource: ResourcesType, side: DirectionType): number {
  if (entity.entityType === "tunnel" && !tunnelAllowsOutput(entity, side, resource)) return 0;
  const reserved = entity.entityType === "storage" && entity.kind === "shipping-depot" ? depotReserved(world, entity, resource) : 0;
  const reserve = entity.entityType === "storage" && entity.kind !== "shipping-depot" ? entity.reserveThreshold ?? 0 : 0;
  return Math.max(0, (entity.stored[resource] ?? 0) - Math.max(reserved, reserve));
}

function firstStoredResource(world: World, entity: StoredEntity, side: DirectionType): ResourcesType | undefined {
  return (Object.keys(entity.stored) as ResourcesType[]).find(resource => resource !== "water" && available(world, entity, resource, side) > 0);
}

export function runStorageOutputs(world: World): World {
  const storages = world.storages.map(storage => ({...storage, stored: {...storage.stored}}));
  const tunnels = world.tunnels.map(tunnel => ({...tunnel, stored: {...tunnel.stored}}));
  const machines = world.machines.map(machine => ({...machine, buffer: {...machine.buffer}}));
  const conveyors = world.conveyors.map(conveyor => ({...conveyor, carrying: [...conveyor.carrying]}));
  const machinesByPosition = new Map(machines.flatMap((machine, index) =>
    machineFootprintCells(machine).map(cell => [positionKey(cell), index] as const)));
  const conveyorsByPosition = new Map(conveyors.map((conveyor, index) => [positionKey(conveyor), index]));

  const liveWorld = {...world, storages};
  for (const storage of [...storages, ...tunnels].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))) {
    for (const direction of directions) {
      const pos = nextPosition(storage, direction);
      const machineIndex = machinesByPosition.get(positionKey(pos));
      if (machineIndex !== undefined) {
        const machine = machines[machineIndex];
        if (positionKey(storage) === positionKey(machineOutputPosition(machine))) continue;
        const input = (Object.keys(storage.stored) as ResourcesType[]).find(resource =>
          available(liveWorld, storage, resource, direction) > 0 && recipeAcceptsResource(machine, resource) && machineInputSpace(machine, resource) > 0);
        if (!input) continue;
        storage.stored[input] = (storage.stored[input] ?? 0) - 1;
        machine.buffer[input] = (machine.buffer[input] ?? 0) + 1;
        continue;
      }

      const conveyorIndex = conveyorsByPosition.get(positionKey(pos));
      if (conveyorIndex === undefined) continue;
      const conveyor = conveyors[conveyorIndex];
      // acceptsInput exclut aussi les tapis qui pointent vers le coffre.
      if (!acceptsInput(conveyor, storage)) continue;
      if (conveyor.carrying.length >= conveyor.capacity) continue;
      const resource = firstStoredResource(liveWorld, storage, direction);
      if (!resource) continue;
      storage.stored[resource] = (storage.stored[resource] ?? 0) - 1;
      conveyor.carrying.push({type: resource, amount: 1, progress: 0});
    }
  }

  return {...world, storages, tunnels, machines, conveyors};
}
