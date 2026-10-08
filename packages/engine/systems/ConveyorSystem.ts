import type {World} from "@engine/models/World";
import type {Machine} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";
import {machineInputSpace, recipeAcceptsResource} from "@engine/config/recipeConfig";
import {buildNetworkTopology, inputPort, type NetworkTopology} from "./NetworkTopology";
import type {SmartSplitterPort} from "@engine/models/Conveyor";

// Une machine n'accepte que l'ingredient de sa recette ; les extracteurs n'acceptent rien.
const acceptsResource = (machine: Machine, resource: ResourcesType) =>
  recipeAcceptsResource(machine, resource);

export function runConveyors(world: World, network: NetworkTopology = buildNetworkTopology(world)): void {
  const next = world.conveyors.map(c => ({...c, carrying: [] as typeof c.carrying}));
  const arrivals = world.conveyors.map(() => [] as World["conveyors"][number]["carrying"]);
  const slots = world.conveyors.map(c => c.capacity - c.carrying.length);
  // Priorite circulaire des entrees de merger, stable quel que soit l'ordre des tableaux.
  const priority = (index: number) => {
    const target = network.targets[index];
    const merger = target?.kind === "belt" ? world.conveyors[target.index] : undefined;
    return merger?.type === "merger"
      ? (inputPort(merger, world.conveyors[index]) - (merger.routingCursor ?? 0) + 4) % 4 : 0;
  };
  const order = [...network.beltOrder].sort((a, b) => priority(a) - priority(b));
  for (const index of order) {
    const belt = world.conveyors[index];
    const carrying = next[index].carrying;
    for (const item of belt.carrying) {
      let remaining = item.amount;
      if (item.type === "water") {
        carrying.push({...item, amount: remaining});
        continue;
      }
      if (item.progress >= 1) {
        const outputs = network.outputs[index];
        const isSplitter = belt.type === "splitter" || belt.type === "smart-splitter";
        const start = isSplitter ? (next[index].routingCursor ?? 0) % outputs.length : 0;
        for (let offset = 0; offset < outputs.length; offset++) {
          const port = (start + offset) % outputs.length;
          const target = outputs[port];
          if (!target) continue;
          if (belt.type === "smart-splitter") {
            const relativePort: SmartSplitterPort = (["forward", "right", "left"] as const)[port];
            const filter = belt.outputFilters?.[relativePort] ?? "any";
            if (filter === "unfiltered") {
              const explicitlyFiltered = Object.values(belt.outputFilters ?? {}).some(value => value === item.type);
              if (explicitlyFiltered) continue;
            } else if (filter !== "any" && filter !== item.type) continue;
          }
          let moved = 0;
          if (target.kind === "belt" && slots[target.index] > 0) {
            arrivals[target.index].push({...item, amount: remaining, progress: 0});
            slots[target.index]--;
            moved = remaining;
            if (next[target.index].type === "merger") {
              next[target.index].routingCursor = (inputPort(next[target.index], belt) + 1) % 4;
            }
          } else if (target.kind === "machine" && acceptsResource(world.machines[target.index], item.type)) {
            const machine = world.machines[target.index];
            moved = Math.min(remaining, machineInputSpace(machine, item.type));
            machine.buffer[item.type] = (machine.buffer[item.type] ?? 0) + moved;
          } else if (target.kind === "storage" || target.kind === "tunnel") {
            const entity = target.kind === "storage" ? world.storages[target.index] : world.tunnels[target.index];
            if (target.kind === "tunnel") {
              moved = Math.min(remaining, Math.max(0, entity.capacity - (entity.stored[item.type] ?? 0)));
            } else {
              const used = Object.values(entity.stored).reduce((sum, amount) => sum + amount, 0);
              moved = Math.min(remaining, Math.max(0, entity.capacity - used));
            }
            entity.stored[item.type] = (entity.stored[item.type] ?? 0) + moved;
            if (target.kind === "tunnel" && world.tunnels[target.index].type === "output") {
              world.campaign.statistics.exported[item.type] += moved;
              const level = world.campaign.levels.find(level => level.id === world.tunnels[target.index].levelId);
              if (level) {
                level.exports ??= {};
                level.exports[item.type] = (level.exports[item.type] ?? 0) + moved;
              }
            }
          }
          remaining -= moved;
          next[index].transported = (next[index].transported ?? 0) + moved;
          if (moved > 0) {
            if (isSplitter) next[index].routingCursor = (port + 1) % outputs.length;
            break;
          }
        }
      }
      if (remaining > 0) {
        const ahead = carrying.at(-1)?.progress;
        const limit = ahead === undefined ? 1 : Math.max(0, ahead - 0.35);
        carrying.push({...item, amount: remaining, progress: Math.min(item.progress + belt.speed, limit)});
      }
    }
  }
  world.conveyors = next.map((updated, index) => {
    updated.carrying.push(...arrivals[index]);
    return updated;
  });
}
