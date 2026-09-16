import {MACHINE_RECIPES} from "@engine/config/recipeConfig";
import type {ResourcesType} from "@engine/models/Resources";
import type {Storage} from "@engine/models/Storage";
import type {World} from "@engine/models/World";
import {acceptsInput, directions, nextPosition, positionKey} from "@engine/systems/NetworkTopology";

const usedCapacity = (buffer: Record<ResourcesType, number>) =>
  Object.values(buffer).reduce((sum, amount) => sum + amount, 0);

function firstStoredResource(storage: Storage): ResourcesType | undefined {
  return (Object.keys(storage.stored) as ResourcesType[]).find(resource => (storage.stored[resource] ?? 0) > 0);
}

export function runStorageOutputs(world: World): World {
  const storages = world.storages.map(storage => ({...storage, stored: {...storage.stored}}));
  const machines = world.machines.map(machine => ({...machine, buffer: {...machine.buffer}}));
  const conveyors = world.conveyors.map(conveyor => ({...conveyor, carrying: [...conveyor.carrying]}));
  const machinesByPosition = new Map(machines.map((machine, index) => [positionKey(machine), index]));
  const conveyorsByPosition = new Map(conveyors.map((conveyor, index) => [positionKey(conveyor), index]));

  for (const storage of storages) {
    for (const direction of directions) {
      const pos = nextPosition(storage, direction);
      const machineIndex = machinesByPosition.get(positionKey(pos));
      if (machineIndex !== undefined) {
        const machine = machines[machineIndex];
        const recipe = MACHINE_RECIPES[machine.type];
        if (!recipe || (storage.stored[recipe.input] ?? 0) <= 0) continue;
        if (usedCapacity(machine.buffer) >= machine.capacity) continue;
        storage.stored[recipe.input] -= 1;
        machine.buffer[recipe.input] = (machine.buffer[recipe.input] ?? 0) + 1;
        continue;
      }

      const conveyorIndex = conveyorsByPosition.get(positionKey(pos));
      if (conveyorIndex === undefined) continue;
      const conveyor = conveyors[conveyorIndex];
      // acceptsInput exclut aussi les tapis qui pointent vers le coffre.
      if (!acceptsInput(conveyor, storage)) continue;
      if (conveyor.carrying.length >= conveyor.capacity) continue;
      const resource = firstStoredResource(storage);
      if (!resource) continue;
      storage.stored[resource] -= 1;
      conveyor.carrying.push({type: resource, amount: 1, progress: 0});
    }
  }

  return {...world, storages, machines, conveyors};
}

