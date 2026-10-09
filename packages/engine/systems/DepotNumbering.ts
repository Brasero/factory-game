import type {World} from "@engine/models/World";

// Les numéros ne sont jamais réutilisés après une démolition.
export function numberDepots(world: World): void {
  const depots = world.storages.filter(storage => storage.kind === "shipping-depot");
  if (!depots.length && world.campaign.nextDepotNumber === undefined) return;
  let next = Math.max(world.campaign.nextDepotNumber ?? 1, ...depots.map(depot => (depot.depotNumber ?? 0) + 1));
  for (const depot of depots) depot.depotNumber ??= next++;
  world.campaign.nextDepotNumber = next;
}
