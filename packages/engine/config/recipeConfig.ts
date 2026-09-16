import type {MachineType} from "@engine/models/Machine";
import type {ResourcesType} from "@engine/models/Resources";

export type MachineRecipe = {
  input: ResourcesType;
  output: ResourcesType;
  duration: number;
};

export const MACHINE_RECIPES: Partial<Record<MachineType, MachineRecipe>> = {
  "iron-smelter": {
    input: "iron",
    output: "ironPlate",
    duration: 20
  }
};

