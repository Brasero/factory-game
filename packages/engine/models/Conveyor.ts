import {ResourcesType} from "./Resources";
import type {Machine} from "@engine/models/Machine.ts";
import {isMachineType} from "@engine/models/Machine.ts";

export type DirectionType = "up" | "down" | "left" | "right";

export interface Conveyor extends Machine {
  type: "conveyor";
  direction: DirectionType;
  carrying?: { type: ResourcesType; amount: number, progress: number };
}

export function isConveyorType(entity: unknown): boolean {
  return (
      typeof entity === 'object' &&
      isMachineType(entity) &&
      "direction" in entity &&
      (
          Object.keys(entity).length === 1 ||
          (
              "carrying" in entity && Object.keys(entity).length === 2
          )
      )
  )
}