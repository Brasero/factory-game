import type {World} from "../models/World";
import type {Machine} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";
import {MACHINE_BASE_POLLUTION, MACHINE_VARIANTS} from "@engine/config/machineConfig";
import {recipeFor, recipeInputs, recipeOutputs} from "@engine/config/recipeConfig";
import {campaignLevelAt, NATURAL_POLLUTION_RECOVERY} from "@engine/config/campaignConfig";

const extractorResource = (machine: Machine): ResourcesType | undefined =>
  machine.type === "iron-mine" ? "iron" : machine.type === "coal-mine" ? "coal" :
    machine.type === "copper-mine" ? "copper" : machine.type === "water-pump" ? "water" : undefined;

export function runProduction(world: World): World {
  const campaign = structuredClone(world.campaign);

  const recordCycle = (machine: Machine, outputs: [ResourcesType, number][], extraction: boolean) => {
    const pollution = MACHINE_BASE_POLLUTION[machine.type] * MACHINE_VARIANTS[machine.variant ?? "standard"].pollution;
    campaign.pollution += pollution;
    const level = campaignLevelAt(machine.x, machine.y);
    const progress = campaign.levels.find(item => item.id === level?.id);
    if (progress) progress.pollution += pollution;
    for (const [resource, amount] of outputs) {
      const statistics = extraction ? campaign.statistics.extracted : campaign.statistics.produced;
      statistics[resource] += amount;
    }
  };

  const machines = world.machines.map(machine => {
    if (machine.paused) return {...machine, active: false};
    const recipe = recipeFor(machine);
    if (recipe) {
      const buffer = {...machine.buffer};
      const inputs = recipeInputs(machine);
      const outputs = recipeOutputs(machine);
      const canConsume = inputs.every(([resource, amount]) => (buffer[resource] ?? 0) >= amount);
      const canStoreOutputs = outputs.every(([resource, amount]) =>
        (buffer[resource] ?? 0) + amount * machine.production <= machine.capacity);
      const canReducePollution = !recipe.pollutionReduction || campaign.pollution > 0;
      if (!canConsume || !canStoreOutputs || !canReducePollution) return {...machine, active: false};
      const progress = machine.progress + machine.efficiency;
      if (progress < recipe.duration) return {...machine, buffer, progress, active: true};
      for (const [resource, amount] of inputs) buffer[resource] = (buffer[resource] ?? 0) - amount;
      const produced = outputs.map(([resource, amount]) => [resource, amount * machine.production] as [ResourcesType, number]);
      for (const [resource, amount] of produced) buffer[resource] = (buffer[resource] ?? 0) + amount;
      recordCycle(machine, produced, false);
      if (recipe.pollutionReduction) {
        campaign.pollution = Math.max(0, campaign.pollution - recipe.pollutionReduction);
      }
      return {...machine, buffer, progress: 0, active: true};
    }

    const resource = extractorResource(machine);
    if (!resource) return machine;
    const buffer = {...machine.buffer};
    const totalStored = Object.values(buffer).reduce((sum, amount) => sum + amount, 0);
    if (totalStored >= machine.capacity) return {...machine, active: false};
    const progress = machine.progress + machine.efficiency;
    if (progress < 10) return {...machine, buffer, progress, active: true};
    const amount = Math.min(machine.production, machine.capacity - totalStored);
    buffer[resource] = (buffer[resource] ?? 0) + amount;
    recordCycle(machine, [[resource, amount]], true);
    return {...machine, buffer, progress: 0, active: true};
  });

  if (campaign.pollution >= campaign.pollutionLimit) campaign.status = "game-over";
  else campaign.pollution = Math.max(0, campaign.pollution - NATURAL_POLLUTION_RECOVERY);
  return {...world, machines, campaign};
}
