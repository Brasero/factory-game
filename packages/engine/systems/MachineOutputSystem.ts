import type {World} from "@engine/models/World";
import type {ResourcesType} from "@engine/models/Resources";
import {buildNetworkTopology, type NetworkTopology} from "./NetworkTopology";

export function runOutputMachine(world: World, network: NetworkTopology = buildNetworkTopology(world)): World {
  const conveyors = world.conveyors.map(c => ({...c, carrying: [...c.carrying]}));
  const machines = [...world.machines];
  for (const index of network.machineOrder) {
    const m = machines[index];
    const targetIndex = network.machineOutputs[index];
    const target = targetIndex === undefined ? undefined : conveyors[targetIndex];
    if (!target || target.carrying.length >= target.capacity) continue;
    const resource = (Object.keys(m.buffer) as ResourcesType[]).find(key => m.buffer[key] > 0);
    if (!resource) continue;
    target.carrying.push({type: resource, amount: 1, progress: 0});
    machines[index] = {...m, buffer: {...m.buffer, [resource]: m.buffer[resource] - 1}};
  }
  return {...world, machines, conveyors};
}
