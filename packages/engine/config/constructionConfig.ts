import type {SelectedItem} from "@engine/models/Controls";
import type {MachineVariant} from "@engine/models/Machine";

export const INITIAL_CONSTRUCTION_MATERIALS = 150;
export const LEVEL_CONSTRUCTION_REWARD = 50;
export const ISLAND_FINALIZATION_REWARD = 30;
export const FINALIZED_ISLAND_EMISSION_RATIO = 0.9;
export const CONSTRUCTION_REFUND_RATIO = 0.75;

const BASE_COSTS: Partial<Record<SelectedItem, number>> = {
  miner: 20,
  "iron-mine": 20,
  "coal-mine": 20,
  "copper-mine": 20,
  "uranium-mine": 20,
  "water-pump": 20,
  "iron-smelter": 30,
  "steel-smelter": 30,
  "wire-mill": 40,
  assembler: 40,
  "advanced-assembler": 70,
  boiler: 25,
  recycler: 25,
  storage: 10,
  "shipping-depot": 20,
  conveyor: 1,
  pipe: 1,
  splitter: 5,
  merger: 5,
  "smart-splitter": 8
};

const VARIANT_COST_MULTIPLIER: Record<MachineVariant, number> = {
  eco: 1.3,
  standard: 1,
  industrial: 1.5
};

const variantMachines = new Set<SelectedItem>([
  "miner", "iron-mine", "coal-mine", "copper-mine", "uranium-mine", "water-pump", "iron-smelter",
  "steel-smelter", "wire-mill", "assembler", "advanced-assembler", "boiler", "recycler"
]);

export function constructionCost(item: SelectedItem, variant: MachineVariant = "standard"): number {
  const base = BASE_COSTS[item] ?? 0;
  return variantMachines.has(item) ? Math.ceil(base * VARIANT_COST_MULTIPLIER[variant]) : base;
}
