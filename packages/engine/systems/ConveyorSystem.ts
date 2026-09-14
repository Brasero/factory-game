import type {World} from "@engine/models/World";
import {buildNetworkTopology, type NetworkTopology} from "./NetworkTopology";

export function runConveyors(world: World, network: NetworkTopology = buildNetworkTopology(world)): void {
  const next = world.conveyors.map(c => ({...c, carrying: [] as typeof c.carrying}));
  const arrivals = world.conveyors.map(() => [] as World["conveyors"][number]["carrying"]);
  const slots = world.conveyors.map(c => c.capacity - c.carrying.length);
  for (const index of network.beltOrder) {
    const belt = world.conveyors[index];
    const carrying = next[index].carrying;
    const target = network.targets[index];
    const machine = target?.kind === "machine" ? world.machines[target.index] : undefined;
    const storage = target?.kind === "storage" ? world.storages[target.index] : undefined;
    const destination = machine ? {buffer: machine.buffer, capacity: machine.capacity}
      : storage ? {buffer: storage.stored, capacity: storage.capacity} : undefined;
    for (const item of belt.carrying) {
      let remaining = item.amount;
      if (item.progress >= 1) {
        if (destination) {
          const used = Object.values(destination.buffer).reduce((sum, amount) => sum + amount, 0);
          const moved = Math.min(remaining, Math.max(0, destination.capacity - used));
          destination.buffer[item.type] = (destination.buffer[item.type] ?? 0) + moved;
          remaining -= moved;
        } else if (target?.kind === "belt" && slots[target.index] > 0) {
          arrivals[target.index].push({...item, progress: 0});
          slots[target.index]--;
          remaining = 0;
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
