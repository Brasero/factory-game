import type {World} from "@engine/models/World";
import type {Machine} from "@engine/models/Machine";
import type {Conveyor} from "@engine/models/Conveyor";
import type {Storage} from "@engine/models/Storage";
import type {Tunnel} from "@engine/models/Tunnel";
import type {CampaignState} from "@engine/models/Campaign";
import type {Resources} from "@engine/models/Resources";
import {createWorld} from "@engine/world/WorldFactory";
import {CAMPAIGN_POLLUTION_LIMIT} from "@engine/config/campaignConfig";

export type GameSave = {
  version: 1;
  tick: number;
  machines: Machine[];
  conveyors: Conveyor[];
  storages: Storage[];
  tunnels: Tunnel[];
  resources: Resources;
  campaign: CampaignState;
};

export function serializeWorld(world: World): GameSave {
  return structuredClone({version: 1, tick: world.tick, machines: world.machines, conveyors: world.conveyors,
    storages: world.storages, tunnels: world.tunnels, resources: world.resources, campaign: world.campaign});
}

export function restoreWorld(save: GameSave): World {
  if (save.version !== 1) throw new Error("Version de sauvegarde incompatible.");
  const world = createWorld();
  world.tick = save.tick;
  world.machines = structuredClone(save.machines).map(machine => {
    if (machine.type === "steel-smelter") {
      return {...machine, type: "iron-smelter" as const, recipeId: "steel-smelting" as const, spriteName: "ironSmelter"};
    }
    if (machine.type === "wire-mill") {
      return {...machine, type: "assembler" as const, recipeId: "copper-wire" as const, spriteName: "assembler"};
    }
    return machine;
  });
  world.conveyors = structuredClone(save.conveyors);
  world.storages = structuredClone(save.storages);
  world.tunnels = world.tunnels.map(tunnel => {
    const saved = save.tunnels.find(item => item.id === tunnel.id);
    return saved ? {...tunnel, stored: structuredClone(saved.stored)} : tunnel;
  });
  world.resources = structuredClone(save.resources);
  world.campaign = structuredClone(save.campaign);
  world.campaign.pollutionLimit = CAMPAIGN_POLLUTION_LIMIT;
  for (const entity of [...world.machines, ...world.conveyors, ...world.storages]) world.grid?.occupy(entity);
  return world;
}

export function isGameSave(value: unknown): value is GameSave {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<GameSave>;
  return save.version === 1 && typeof save.tick === "number" && Array.isArray(save.machines) &&
    Array.isArray(save.conveyors) && Array.isArray(save.storages) && Array.isArray(save.tunnels) && !!save.campaign;
}
