import type {World} from "@engine/models/World";
import type {LevelObjective, LevelProgress, ObjectiveProgress} from "@engine/models/Campaign";
import {CAMPAIGN_LEVELS, objectiveValue} from "@engine/config/campaignConfig";
import {LEVEL_CONSTRUCTION_REWARD} from "@engine/config/constructionConfig";
import type {Resources} from "@engine/models/Resources";

const amount = (values: Partial<Resources>, resource: keyof Resources) => values[resource] ?? 0;
const fresh = (level: LevelProgress): ObjectiveProgress => ({value: 0, sustained: 0, baseline: {...level.exports}, emissions: level.pollution, attempts: 0});

export function advanceObjective(objective: LevelObjective, state: ObjectiveProgress, level: LevelProgress): boolean {
  if (state.completedAt !== undefined) return true;
  if (objective.emissionBudget !== undefined && level.pollution - state.emissions > objective.emissionBudget) {
    Object.assign(state, fresh(level), {attempts: state.attempts + 1});
    return false;
  }
  const deliveries = objective.requirements ?? {[objective.resource]: objective.amount};
  state.value = Math.min(...Object.entries(deliveries).map(([resource, target]) =>
    (amount(level.exports ?? {}, resource as keyof Resources) - amount(state.baseline, resource as keyof Resources)) / target!)) * objective.amount;
  if (objective.rate) {
    const rate = amount(level.telemetry?.rates ?? {}, objective.resource);
    // Une interruption suspend l'effort ; la progression déjà obtenue reste acquise.
    if (rate >= objective.rate.amount && (level.telemetry?.samples.length ?? 0) >= objective.rate.window) state.sustained++;
  }
  return state.value >= objective.amount && (!objective.rate || state.sustained >= objective.rate.duration);
}

export function runCampaign(world: World): World {
  if (world.campaign.status === "game-over") return world;
  const campaign = structuredClone(world.campaign);
  for (let index = 0; index < CAMPAIGN_LEVELS.length; index++) {
    const definition = CAMPAIGN_LEVELS[index];
    const level = campaign.levels.find(level => level.id === definition.id)!;
    if (level.status === "locked") continue;
    level.exports ??= {};
    const telemetry: NonNullable<LevelProgress["telemetry"]> = level.telemetry ??= {lastExports: {}, samples: [], rates: {}, record: 0};
    // Une seule observation par tick, même si l'UI publie plusieurs snapshots.
    const observed = telemetry.samples.at(-1)?.tick !== world.tick;
    if (observed) {
      const delta: Partial<Resources> = {};
      for (const resource of Object.keys(level.exports) as (keyof Resources)[]) {
        delta[resource] = Math.max(0, amount(level.exports, resource) - amount(telemetry.lastExports, resource));
      }
      telemetry.samples.push({tick: world.tick, exports: delta});
      telemetry.samples = telemetry.samples.filter(sample => sample.tick > world.tick - 100);
      telemetry.lastExports = {...level.exports};
      telemetry.rates = {};
      for (const sample of telemetry.samples) for (const resource of Object.keys(sample.exports) as (keyof Resources)[]) {
        telemetry.rates[resource] = amount(telemetry.rates, resource) + amount(sample.exports, resource);
      }
      if (Object.values(delta).some(value => value! > 0)) telemetry.firstExportAt ??= world.tick;
      telemetry.record = Math.max(telemetry.record, amount(telemetry.rates, definition.objective.resource));
    }
    level.challenges ??= {};
    for (const challenge of definition.challenges ?? []) {
      const state = level.challenges[challenge.id] ??= {...fresh(level), baseline: {}};
      if (observed && state.completedAt === undefined && advanceObjective(challenge.objective, state, level)) {
        state.completedAt = world.tick;
        campaign.constructionMaterials += challenge.reward;
      }
    }
    if (level.status !== "active" || campaign.status !== "playing") continue;
    const objective = definition.objective;
    const state = level.objectiveProgress ??= {...fresh(level), baseline: {}};
    const simple = !objective.rate && !objective.requirements && objective.emissionBudget === undefined;
    const success = simple ? objectiveValue(campaign.statistics, world.resources, definition) >= objective.amount
      : observed && advanceObjective(objective, state, level);
    if (!success) continue;
    state.completedAt = world.tick;
    level.status = "completed";
    level.completedAt = world.tick;
    campaign.constructionMaterials += LEVEL_CONSTRUCTION_REWARD;
    const next = campaign.levels[index + 1];
    if (next?.status === "locked") next.status = "active";
    if (!next) campaign.status = "finished";
  }
  return {...world, campaign};
}
