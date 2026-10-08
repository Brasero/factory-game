import type {ResourcesType} from "./Resources";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export type DirectionType = "up" | "down" | "left" | "right";
export type ConveyorTier = 1 | 2 | 3 | 4;
export type SmartSplitterPort = "left" | "forward" | "right";
export type SmartSplitterFilter = ResourcesType | "any" | "unfiltered";
export type ResourceCarryingType = {
  type: ResourcesType;
  amount: number;
  progress: number
}

export interface Conveyor extends BaseEntity {
  entityType: 'conveyor';
  type: "conveyor" | "splitter" | "smart-splitter" | "merger";
  /** Visual/upgrade level. Missing on old saves and routers; level 1 is the fallback. */
  tier?: ConveyorTier;
  routingCursor?: number;
  outputFilters?: Partial<Record<SmartSplitterPort, SmartSplitterFilter>>;
  direction: DirectionType;
  carrying: ResourceCarryingType[];
  speed: number;
  capacity: number;
  transported?: number;
  flow?: {tick: number; baseline: number; rate: number};
}

export function isConveyorType(entity: unknown): entity is Conveyor {
  return (
      typeof entity === 'object' &&
      entity !== null &&
      "entityType" in entity && entity.entityType === 'conveyor'
  )
}
