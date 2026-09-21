import type {MachineType, MachineVariant} from "@engine/models/Machine";

export const MACHINE_CAPACITY: Record<MachineType, number> = {
  "iron-mine": 100, "coal-mine": 100, "copper-mine": 100, "water-pump": 100,
  "iron-smelter": 100, "steel-smelter": 100, "wire-mill": 100, assembler: 100, conveyor: 1
};

export const MACHINE_SPRITE_SHEET: Record<MachineType, string> = {
  "iron-mine": "miner2", "coal-mine": "miner2", "copper-mine": "miner2", "water-pump": "water",
  "iron-smelter": "ironSmelter", "steel-smelter": "steelSmelter", "wire-mill": "wireMill", assembler: "assembler", conveyor: ""
};

export type MachineProfile = {speed: number; production: number; pollution: number};
export const MACHINE_VARIANTS: Record<MachineVariant, MachineProfile> = {
  eco: {speed: 0.6, production: 1, pollution: 0.3},
  standard: {speed: 1, production: 1, pollution: 1},
  industrial: {speed: 1.8, production: 2, pollution: 2.6}
};

export const MACHINE_BASE_POLLUTION: Record<MachineType, number> = {
  "iron-mine": 1, "coal-mine": 1.3, "copper-mine": 1.2, "water-pump": 0.2,
  "iron-smelter": 2, "steel-smelter": 3, "wire-mill": 1.2, assembler: 1.5, conveyor: 0
};
