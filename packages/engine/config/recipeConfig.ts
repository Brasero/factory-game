import type {Machine, MachineType} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";

export type RecipeId = "iron-smelting" | "steel-smelting" | "copper-wire" | "circuit-assembly";

export type MachineRecipe = {
  id: RecipeId;
  name: string;
  inputs: Partial<Record<ResourcesType, number>>;
  outputs: Partial<Record<ResourcesType, number>>;
  duration: number;
};

export const RECIPES: Record<RecipeId, MachineRecipe> = {
  "iron-smelting": {id: "iron-smelting", name: "Lingot de fer", inputs: {iron: 1}, outputs: {ironPlate: 1}, duration: 20},
  "steel-smelting": {id: "steel-smelting", name: "Acier", inputs: {ironPlate: 1, coal: 1}, outputs: {steel: 1}, duration: 30},
  "copper-wire": {id: "copper-wire", name: "Fil de cuivre", inputs: {copper: 1}, outputs: {copperWire: 2}, duration: 18},
  "circuit-assembly": {id: "circuit-assembly", name: "Circuit", inputs: {ironPlate: 1, copperWire: 2}, outputs: {circuit: 1}, duration: 35}
};

export const MACHINE_RECIPE_OPTIONS: Partial<Record<MachineType, RecipeId[]>> = {
  "iron-smelter": ["iron-smelting", "steel-smelting"],
  "steel-smelter": ["steel-smelting", "iron-smelting"],
  "wire-mill": ["copper-wire"],
  assembler: ["circuit-assembly"]
};

export const defaultRecipe = (type: MachineType): RecipeId | undefined => MACHINE_RECIPE_OPTIONS[type]?.[0];
export const recipeFor = (machine: Pick<Machine, "type" | "recipeId">): MachineRecipe | undefined =>
  RECIPES[machine.recipeId ?? defaultRecipe(machine.type)!];
export const recipeInputs = (machine: Pick<Machine, "type" | "recipeId">) =>
  Object.entries(recipeFor(machine)?.inputs ?? {}) as [ResourcesType, number][];
export const recipeOutputs = (machine: Pick<Machine, "type" | "recipeId">) =>
  Object.entries(recipeFor(machine)?.outputs ?? {}) as [ResourcesType, number][];
