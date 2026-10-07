import type {World} from "@engine/models/World";
import type {Machine} from "@engine/models/Machine";
import type {Conveyor} from "@engine/models/Conveyor";
import type {Storage} from "@engine/models/Storage";
import type {Tunnel} from "@engine/models/Tunnel";
import type {CampaignState} from "@engine/models/Campaign";
import type {Resources} from "@engine/models/Resources";
import {createWorld} from "@engine/world/WorldFactory";
import {CAMPAIGN_LEVELS, CAMPAIGN_POLLUTION_LIMIT, campaignLevelAt} from "@engine/config/campaignConfig";
import type {Pipe} from "@engine/models/Pipe";
import type {Position} from "@engine/models/Position";
import {INITIAL_CONSTRUCTION_MATERIALS} from "@engine/config/constructionConfig";
import {emptyResources} from "@engine/models/Resources";
import {machineFootprintCells} from "@engine/config/machineFootprint";

export type GameSave = {
  version: 1;
  tick: number;
  machines: Machine[];
  conveyors: Conveyor[];
  pipes?: Pipe[];
  storages: Storage[];
  tunnels: Tunnel[];
  resources: Resources;
  campaign: CampaignState;
  removedDecorations?: Position[];
  decorations?: Array<Position & {type: string; variant: number}>;
};

export function serializeWorld(world: World): GameSave {
  return structuredClone({version: 1, tick: world.tick, machines: world.machines, conveyors: world.conveyors, pipes: world.pipes,
    storages: world.storages, tunnels: world.tunnels, resources: world.resources, campaign: world.campaign,
    removedDecorations: world.grid?.getRemovedDecorations() ?? [],
    decorations: world.grid?.getDecorations() ?? []});
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
  world.conveyors = structuredClone(save.conveyors).map(conveyor =>
    conveyor.type === "conveyor" ? {...conveyor, tier: conveyor.tier ?? 1} : conveyor);
  world.pipes = structuredClone(save.pipes ?? []);
  world.storages = structuredClone(save.storages);
  world.tunnels = world.tunnels.map(tunnel => {
    const saved = save.tunnels.find(item => item.id === tunnel.id);
    return saved ? {...tunnel, stored: structuredClone(saved.stored)} : tunnel;
  });
  world.resources = {...emptyResources(), ...structuredClone(save.resources)};
  const savedCampaign = structuredClone(save.campaign);
  const savedLevelIds = new Set(savedCampaign.levels.map(level => level.id));
  let expansionUnlocked = savedCampaign.status === "finished";
  savedCampaign.levels = CAMPAIGN_LEVELS.map((definition, index) => {
    const saved = save.campaign.levels.find(level => level.id === definition.id);
    if (saved) {
      expansionUnlocked ||= saved.status === "completed" || saved.status === "finalized";
      return structuredClone(saved);
    }
    const previous = savedCampaign.levels[index - 1];
    const status = expansionUnlocked && previous && previous.status !== "locked" ? "active" as const : "locked" as const;
    expansionUnlocked = false;
    return {id: definition.id, status, pollution: 0};
  });
  savedCampaign.statistics = {
    extracted: {...emptyResources(), ...savedCampaign.statistics.extracted},
    produced: {...emptyResources(), ...savedCampaign.statistics.produced},
    exported: {...emptyResources(), ...savedCampaign.statistics.exported}
  };
  if (savedCampaign.status === "finished" && CAMPAIGN_LEVELS.some(level => !savedLevelIds.has(level.id))) {
    savedCampaign.status = "playing";
    savedCampaign.activeLevelId = savedCampaign.levels.find(level => level.status === "active")?.id ?? savedCampaign.activeLevelId;
  }
  world.campaign = savedCampaign;
  world.campaign.constructionMaterials ??= INITIAL_CONSTRUCTION_MATERIALS;
  world.campaign.pollutionLimit = CAMPAIGN_POLLUTION_LIMIT;
  if (save.decorations) {
    const expansionDecorations = world.grid?.getDecorations().filter(decoration => {
      const level = campaignLevelAt(decoration.x, decoration.y);
      return level && !savedLevelIds.has(level.id);
    }) ?? [];
    world.grid?.replaceDecorations([...save.decorations, ...expansionDecorations]);
  }
  else for (const position of save.removedDecorations ?? []) world.grid?.removeDecoration(position);
  for (const machine of world.machines) machineFootprintCells(machine).forEach(position => world.grid?.occupy(position));
  for (const entity of [...world.conveyors, ...world.pipes, ...world.storages]) world.grid?.occupy(entity);
  return world;
}

export function isGameSave(value: unknown): value is GameSave {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<GameSave>;
  return save.version === 1 && typeof save.tick === "number" && Array.isArray(save.machines) &&
    Array.isArray(save.conveyors) && Array.isArray(save.storages) && Array.isArray(save.tunnels) && !!save.campaign;
}
