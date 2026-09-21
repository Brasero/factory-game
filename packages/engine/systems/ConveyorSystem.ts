import type {World} from "@engine/models/World";
import type {Machine} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";
import {recipeInputs} from "@engine/config/recipeConfig";
import {buildNetworkTopology, inputPort, type NetworkTopology} from "./NetworkTopology";

// Une machine n'accepte que l'ingredient de sa recette ; les extracteurs n'acceptent rien.
const acceptsResource = (machine: Machine, resource: ResourcesType) =>
  recipeInputs(machine).some(([input]) => input === resource);

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
      if (item.progress >= 1) {
        const outputs = network.outputs[index];
        const start = belt.type === "splitter" ? (next[index].routingCursor ?? 0) % outputs.length : 0;
        for (let offset = 0; offset < outputs.length; offset++) {
          const port = (start + offset) % outputs.length;
          const target = outputs[port];
          if (!target) continue;
          let moved = 0;
          if (target.kind === "belt" && slots[target.index] > 0) {
            arrivals[target.index].push({...item, amount: remaining, progress: 0});
            slots[target.index]--;
            moved = remaining;
            if (next[target.index].type === "merger") {
              next[target.index].routingCursor = (inputPort(next[target.index], belt) + 1) % 4;
            }
          } else if (target.kind === "storage" || target.kind === "tunnel" ||
            (target.kind === "machine" && acceptsResource(world.machines[target.index], item.type))) {
            const entity = target.kind === "machine" ? world.machines[target.index] :
              target.kind === "storage" ? world.storages[target.index] : world.tunnels[target.index];
            const buffer = "buffer" in entity ? entity.buffer : entity.stored;
            const used = Object.values(buffer).reduce((sum, amount) => sum + amount, 0);
            moved = Math.min(remaining, Math.max(0, entity.capacity - used));
            buffer[item.type] = (buffer[item.type] ?? 0) + moved;
          }
          remaining -= moved;
          if (moved > 0) {
            if (belt.type === "splitter") next[index].routingCursor = (port + 1) % outputs.length;
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
