import type {World} from "@engine/models/World";
import type {Storage} from "@engine/models/Storage";
import type {ResourcesType} from "@engine/models/Resources";
import {contractDefinition} from "@engine/config/contractConfig";

export function depotDemand(world: World, storage: Storage, resource: ResourcesType): number {
  if (!storage.contractId) return 0;
  const progress = world.campaign.contracts?.[storage.contractId];
  if (progress?.status !== "active" || (progress.deadlineAt !== undefined && world.tick >= progress.deadlineAt)) return 0;
  return contractDefinition(storage.contractId)?.requirements[resource] ?? 0;
}

export function refreshContractReservations(world: World): void {
  for (const progress of Object.values(world.campaign.contracts ?? {})) {
    if (progress.status !== "active") continue;
    const definition = contractDefinition(progress.id);
    const depot = world.storages.find(storage => storage.kind === "shipping-depot" && storage.contractId === progress.id);
    progress.reserved = Object.fromEntries(Object.entries(definition?.requirements ?? {}).map(([resource, target]) =>
      [resource, Math.min(target!, depot?.stored[resource as ResourcesType] ?? 0)]));
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
    const depot = world.storages.find(storage => storage.kind === "shipping-depot" && storage.contractId === progress.id);
    if (!depot) continue;
    if (definition.rate) {
      const telemetry = world.campaign.levels.find(level => level.id === definition.rate!.levelId)?.telemetry;
      if ((telemetry?.samples.length ?? 0) >= 100 && (telemetry?.rates[definition.rate.resource] ?? 0) >= definition.rate.amount) progress.sustained++;
    }
    if (Object.entries(definition.requirements).some(([resource, target]) => (progress.reserved[resource as ResourcesType] ?? 0) < target!) ||
      (definition.rate && progress.sustained < definition.rate.duration)) continue;
    for (const [resource, target] of Object.entries(definition.requirements)) depot.stored[resource as ResourcesType] = (depot.stored[resource as ResourcesType] ?? 0) - target!;
    consumed = true;
    progress.status = "completed"; progress.endedAt = world.tick;
    world.campaign.constructionMaterials += definition.reward;
    releaseContract(world, progress.id);
  }
  return consumed;
}
