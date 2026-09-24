import type {Machine} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";
import {MACHINE_RECIPE_OPTIONS, recipeFor, recipeInputs, recipeOutputs} from "@engine/config/recipeConfig";

export type MachineIdleReason =
  | {type: "paused"}
  | {type: "no-recipe"}
  | {type: "missing-input"; resource: ResourcesType}
  | {type: "output-full"; resource: ResourcesType}
  | {type: "buffer-full"}
  | {type: "pollution-empty"};

const extractorTypes = new Set<Machine["type"]>(["iron-mine", "coal-mine", "copper-mine", "water-pump"]);

export function machineIdleReason(machine: Machine, pollution: number): MachineIdleReason | undefined {
  if (machine.paused) return {type: "paused"};

  const recipe = recipeFor(machine);
  if (MACHINE_RECIPE_OPTIONS[machine.type] && !recipe) return {type: "no-recipe"};
  if (recipe) {
    if (recipe.pollutionReduction && pollution <= 0) return {type: "pollution-empty"};
    const missing = recipeInputs(machine).find(([resource, amount]) => (machine.buffer[resource] ?? 0) < amount);
    if (missing) return {type: "missing-input", resource: missing[0]};
    const full = recipeOutputs(machine).find(([resource, amount]) =>
      (machine.buffer[resource] ?? 0) + amount * machine.production > machine.capacity);
    if (full) return {type: "output-full", resource: full[0]};
    return undefined;
  }

  if (extractorTypes.has(machine.type)) {
    const stored = Object.values(machine.buffer).reduce((sum, amount) => sum + (amount ?? 0), 0);
    if (stored >= machine.capacity) return {type: "buffer-full"};
  }
  return undefined;
}
