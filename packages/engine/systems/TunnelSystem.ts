import type {World} from "@engine/models/World";
import {RESOURCE_TYPES} from "@engine/models/Resources";

export function runTunnels(world: World): World {
  const tunnels = world.tunnels.map(tunnel => ({...tunnel, stored: {...tunnel.stored}}));
  const campaign = structuredClone(world.campaign);

  for (const source of tunnels.filter(tunnel => tunnel.type === "output")) {
    const target = source.linkedTunnelId ? tunnels.find(tunnel => tunnel.id === source.linkedTunnelId) : undefined;
    for (const resource of RESOURCE_TYPES) {
      const amount = source.stored[resource] ?? 0;
      if (amount <= 0) continue;
      if (target) {
        const moved = Math.min(amount, Math.max(0, target.capacity - (target.stored[resource] ?? 0)));
        target.stored[resource] = (target.stored[resource] ?? 0) + moved;
        source.stored[resource] = (source.stored[resource] ?? 0) - moved;
      }
    }
  }

  return {...world, tunnels, campaign};
}
