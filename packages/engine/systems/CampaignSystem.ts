import type {World} from "@engine/models/World";
import {CAMPAIGN_LEVELS, objectiveValue} from "@engine/config/campaignConfig";

export function runCampaign(world: World): World {
  if (world.campaign.status !== "playing") return world;
  const campaign = structuredClone(world.campaign);
  const stored = world.resources;
  for (let index = 0; index < CAMPAIGN_LEVELS.length; index++) {
    const definition = CAMPAIGN_LEVELS[index];
    const progress = campaign.levels.find(level => level.id === definition.id)!;
    if (progress.status !== "active") continue;
    if (objectiveValue(campaign.statistics, stored, definition) < definition.objective.amount) continue;
    progress.status = "completed";
    progress.completedAt = world.tick;
    const next = campaign.levels[index + 1];
    if (next?.status === "locked") next.status = "active";
    if (!next) campaign.status = "finished";
  }
  return {...world, campaign};
}
