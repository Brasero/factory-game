import {ResourcesType} from "./Resources";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export type DirectionType = "up" | "down" | "left" | "right";
export type ResourceCarryingType = {
  type: ResourcesType;
  amount: number;
  progress: number
}

export interface Conveyor extends BaseEntity {
  entityType: 'conveyor';
  type: "conveyor";
  direction: DirectionType;
  carrying: ResourceCarryingType[];
  speed: number;
  capacity: number;
}

export function isConveyorType(entity: unknown): entity is Conveyor {
  return (
      typeof entity === 'object' &&
      entity !== null &&
      (entity as any).entityType === 'conveyor'
  )
}