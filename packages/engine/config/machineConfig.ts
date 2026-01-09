import type {MachineType} from "@engine/models/Machine";

export const MACHINE_CAPACITY: Record<MachineType, number> = {
  "iron-mine": 100,
  "coal-mine": 100,
  "water-pump": 100,
  conveyor: 1
}

export const MACHINE_SPRITE_SHEET: Record<MachineType, string> = {
  "iron-mine": "miner2",
  "coal-mine": "miner2",
  "water-pump": "water",
  conveyor: ""
}