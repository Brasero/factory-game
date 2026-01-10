import {ResourcesType} from "./Resources";
import type {Machine} from "@engine/models/Machine.ts";
import {isMachineType} from "@engine/models/Machine.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export type DirectionType = "up" | "down" | "left" | "right";

export interface Conveyor extends BaseEntity {
  entityType: 'conveyor';
  type: "conveyor";
  direction: DirectionType;
  carrying?: { type: ResourcesType; amount: number, progress: number };
}

export function isConveyorType(entity: unknown): entity is Conveyor {
  return (
      typeof entity === 'object' &&
      entity !== null &&
      (entity as any).entityType === 'conveyor'
  )
}