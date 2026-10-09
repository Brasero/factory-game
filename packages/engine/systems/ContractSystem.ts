import type {World} from "@engine/models/World";
import type {Storage} from "@engine/models/Storage";
import type {ResourcesType} from "@engine/models/Resources";
import {contractDefinition} from "@engine/config/contractConfig";

function depotsFor(world: World, id: string): Storage[] {
  return world.storages.filter(storage => storage.kind === "shipping-depot" && storage.contractId === id)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
}
function targetFor(world: World, storage: Storage, resource: ResourcesType): number {
  if (!storage.contractId) return 0;
  const progress = world.campaign.contracts?.[storage.contractId];
  if (progress?.status !== "active" || (progress.deadlineAt !== undefined && world.tick >= progress.deadlineAt)) return 0;
  return contractDefinition(storage.contractId)?.requirements[resource] ?? 0;
}

// Limite d'entrée : stock de ce point + quantité encore manquante dans l'ensemble des points.
export function depotDemand(world: World, storage: Storage, resource: ResourcesType): number {
  const target = targetFor(world, storage, resource);
  if (!target) return 0;
  const total = depotsFor(world, storage.contractId!).reduce((sum, depot) => sum + (depot.stored[resource] ?? 0), 0);
  return (storage.stored[resource] ?? 0) + Math.max(0, target - total);
}

// Une priorité spatiale stable réserve exactement la commande et restitue seulement le surplus.
export function depotReserved(world: World, storage: Storage, resource: ResourcesType): number {
  let remaining = targetFor(world, storage, resource);
  if (!remaining) return 0;
  for (const depot of depotsFor(world, storage.contractId!)) {
    const held = Math.min(remaining, depot.stored[resource] ?? 0);
    if (depot.id === storage.id) return held;
    remaining -= held;
  }
  return 0;
}

export function refreshContractReservations(world: World): void {
  for (const progress of Object.values(world.campaign.contracts ?? {})) {
    if (progress.status !== "active") continue;
    const definition = contractDefinition(progress.id), depots = depotsFor(world, progress.id);
    progress.reserved = Object.fromEntries(Object.entries(definition?.requirements ?? {}).map(([resource, target]) =>
      [resource, Math.min(target!, depots.reduce((sum, depot) => sum + (depot.stored[resource as ResourcesType] ?? 0), 0))]));
  }
}

export function releaseContract(world: World, id: string): void {
  for (const depot of world.storages) if (depot.contractId === id) depot.contractId = undefined;
}

export function runContracts(world: World): boolean {
  if (world.campaign.status === "game-over") return false;
  let consumed = false;
  refreshContractReservations(world);
  for (const progress of Object.values(world.campaign.contracts ?? {})) {
    if (progress.status !== "active" || progress.lastTick === world.tick) continue;
    progress.lastTick = world.tick;
    const definition = contractDefinition(progress.id);
    if (!definition) continue;
    if (progress.deadlineAt !== undefined && world.tick >= progress.deadlineAt) {
      progress.status = "failed"; progress.endedAt = world.tick; progress.reserved = {};
      releaseContract(world, progress.id);
      continue;
    }
    const depots = depotsFor(world, progress.id);
    if (!depots.length) continue;
    if (definition.rate) {
      const telemetry = world.campaign.levels.find(level => level.id === definition.rate!.levelId)?.telemetry;
      if ((telemetry?.samples.length ?? 0) >= 100 && (telemetry?.rates[definition.rate.resource] ?? 0) >= definition.rate.amount) progress.sustained++;
    }
    if (Object.entries(definition.requirements).some(([resource, target]) => (progress.reserved[resource as ResourcesType] ?? 0) < target!) ||
      (definition.rate && progress.sustained < definition.rate.duration)) continue;
    for (const [key, target] of Object.entries(definition.requirements)) {
      const resource = key as ResourcesType;
      let remaining = target!;
      for (const depot of depots) {
        const taken = Math.min(remaining, depot.stored[resource] ?? 0);
        if (taken) depot.stored[resource] = (depot.stored[resource] ?? 0) - taken;
        remaining -= taken;
      }
    }
    consumed = true;
    progress.status = "completed"; progress.endedAt = world.tick;
    world.campaign.constructionMaterials += definition.reward;
    releaseContract(world, progress.id);
  }
  return consumed;
}
