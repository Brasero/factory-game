import {isPositionType, Position} from "@engine/models/Position";
import {ResourcesType} from "./Resources";

export interface Storage extends Position {
  id: string;
  capacity: number;
  stored: Record<ResourcesType, number>;
}

export function isStorageType(entity: unknown): boolean {
  return (
      isPositionType(entity) &&
      "id" in entity &&
      "capacity" in entity &&
      "stored" in entity &&
      Object.keys(entity).length === 3
  )
}