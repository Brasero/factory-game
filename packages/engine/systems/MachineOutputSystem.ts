import type {World} from "@engine/models/World";
import type {ResourcesType} from "@engine/models/Resources";
import {buildNetworkTopology, type NetworkTopology} from "./NetworkTopology";
import {recipeOutputs} from "@engine/config/recipeConfig";

export function runOutputMachine(world: World, network: NetworkTopology = buildNetworkTopology(world)): World {
  const conveyors = world.conveyors.map(c => ({...c, carrying: [...c.carrying]}));
  const machines = [...world.machines];
  for (const index of network.machineOrder) {
    const m = machines[index];
    const targetIndex = network.machineOutputs[index];
    const target = targetIndex === undefined ? undefined : conveyors[targetIndex];
    if (!target || target.carrying.length >= target.capacity) continue;
    const outputs = recipeOutputs(m);
    const resource = outputs.length > 0
      ? outputs.find(([output]) => (m.buffer[output] ?? 0) > 0)?.[0]
      : (Object.keys(m.buffer) as ResourcesType[]).find(key => (m.buffer[key] ?? 0) > 0);
    if (!resource) continue;
    if ((m.buffer[resource] ?? 0) <= 0) continue;
    target.carrying.push({type: resource, amount: 1, progress: 0});
    machines[index] = {...m, buffer: {...m.buffer, [resource]: (m.buffer[resource] ?? 0) - 1}};
  }
  return {...world, machines, conveyors};
}
