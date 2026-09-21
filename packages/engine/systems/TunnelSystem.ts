import type {World} from "@engine/models/World";
import {RESOURCE_TYPES} from "@engine/models/Resources";
import {acceptsInput, nextPosition, positionKey} from "./NetworkTopology";

export function runTunnels(world: World): World {
  const tunnels = world.tunnels.map(tunnel => ({...tunnel, stored: {...tunnel.stored}}));
  const conveyors = world.conveyors.map(conveyor => ({...conveyor, carrying: [...conveyor.carrying]}));
  const campaign = structuredClone(world.campaign);
  const conveyorAt = new Map(conveyors.map((conveyor, index) => [positionKey(conveyor), index]));

  for (const source of tunnels.filter(tunnel => tunnel.type === "output")) {
    const target = source.linkedTunnelId ? tunnels.find(tunnel => tunnel.id === source.linkedTunnelId) : undefined;
    for (const resource of RESOURCE_TYPES) {
      const amount = source.stored[resource] ?? 0;
      if (amount <= 0) continue;
      if (target) {
        const targetUsed = RESOURCE_TYPES.reduce((sum, type) => sum + (target.stored[type] ?? 0), 0);
        const moved = Math.min(amount, Math.max(0, target.capacity - targetUsed));
        target.stored[resource] = (target.stored[resource] ?? 0) + moved;
        source.stored[resource] = (source.stored[resource] ?? 0) - moved;
        campaign.statistics.exported[resource] += moved;
      } else {
        campaign.statistics.exported[resource] += amount;
        source.stored[resource] = 0;
      }
    }
  }

  for (const tunnel of tunnels.filter(item => item.type === "input")) {
    const index = conveyorAt.get(positionKey(nextPosition(tunnel, tunnel.direction)));
    if (index === undefined) continue;
    const conveyor = conveyors[index];
    if (!acceptsInput(conveyor, tunnel) || conveyor.carrying.length >= conveyor.capacity) continue;
    const resource = RESOURCE_TYPES.find(type => (tunnel.stored[type] ?? 0) > 0);
    if (!resource) continue;
    tunnel.stored[resource] = (tunnel.stored[resource] ?? 0) - 1;
    conveyor.carrying.push({type: resource, amount: 1, progress: 0});
  }

  return {...world, tunnels, conveyors, campaign};
}
