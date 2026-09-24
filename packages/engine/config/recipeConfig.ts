import type {Machine, MachineType} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";

export type RecipeId = "iron-smelting" | "steel-smelting" | "copper-wire" | "circuit-assembly" | "water-purification";

export type MachineRecipe = {
  id: RecipeId;
  name: string;
  inputs: Partial<Record<ResourcesType, number>>;
  outputs: Partial<Record<ResourcesType, number>>;
  duration: number;
  pollutionReduction?: number;
};

export const RECIPES: Record<RecipeId, MachineRecipe> = {
  "iron-smelting": {id: "iron-smelting", name: "Lingot de fer", inputs: {iron: 1}, outputs: {ironPlate: 1}, duration: 20},
  "steel-smelting": {id: "steel-smelting", name: "Acier", inputs: {ironPlate: 1, coal: 1}, outputs: {steel: 1}, duration: 30},
  "copper-wire": {id: "copper-wire", name: "Fil de cuivre", inputs: {copper: 1}, outputs: {copperWire: 2}, duration: 18},
  "circuit-assembly": {id: "circuit-assembly", name: "Circuit", inputs: {ironPlate: 1, copperWire: 2}, outputs: {circuit: 1}, duration: 35},
  "water-purification": {id: "water-purification", name: "Dépollution à l’eau", inputs: {water: 1}, outputs: {}, duration: 20, pollutionReduction: 12}
};

export const MACHINE_RECIPE_OPTIONS: Partial<Record<MachineType, RecipeId[]>> = {
  "iron-smelter": ["iron-smelting", "steel-smelting"],
  "steel-smelter": ["steel-smelting", "iron-smelting"],
  "wire-mill": ["copper-wire"],
  assembler: ["copper-wire", "circuit-assembly"],
  boiler: ["water-purification"]
};

export const defaultRecipe = (type: MachineType): RecipeId | undefined => MACHINE_RECIPE_OPTIONS[type]?.[0];
export const recipeFor = (machine: Pick<Machine, "type" | "recipeId">): MachineRecipe | undefined =>
  machine.recipeId ? RECIPES[machine.recipeId] : undefined;
export const recipeInputs = (machine: Pick<Machine, "type" | "recipeId">) =>
  Object.entries(recipeFor(machine)?.inputs ?? {}) as [ResourcesType, number][];
export const recipeOutputs = (machine: Pick<Machine, "type" | "recipeId">) =>
  Object.entries(recipeFor(machine)?.outputs ?? {}) as [ResourcesType, number][];

export const machineInputSpace = (machine: Pick<Machine, "type" | "recipeId" | "buffer" | "capacity">, resource: ResourcesType) =>
  recipeInputs(machine).some(([input]) => input === resource)
    ? Math.max(0, machine.capacity - (machine.buffer[resource] ?? 0))
    : 0;
