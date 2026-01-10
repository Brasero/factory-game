import {ResourcesType} from "./Resources";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export interface Storage extends BaseEntity {
  id: string;
  entityType: 'storage';
  capacity: number;
  stored: Record<ResourcesType, number>;
}

export function isStorageType(entity: unknown): entity is Storage {
  return (
      typeof entity === "object" &&
      entity !== null &&
      (entity as any).entityType === 'storage'
  )
}