import type {ResourcesType} from "./Resources";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export interface Storage extends BaseEntity {
  id: string;
  entityType: 'storage';
  kind?: "shipping-depot";
  contractId?: string;
  depotNumber?: number;
  capacity: number;
  /** Minimum inventory retained for each resource. */
  reserveThreshold?: number;
  stored: Partial<Record<ResourcesType, number>>;
}

export function isStorageType(entity: unknown): entity is Storage {
  return (
      typeof entity === "object" &&
      entity !== null &&
      "entityType" in entity && entity.entityType === 'storage'
  )
}
