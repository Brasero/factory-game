import type {BaseEntity} from "./BaseEntity";
import type {DirectionType} from "./Conveyor";

export interface Pipe extends BaseEntity {
  entityType: "pipe";
  direction: DirectionType;
  water: number;
  capacity: number;
}

export function isPipe(entity: unknown): entity is Pipe {
  return typeof entity === "object" && entity !== null && "entityType" in entity && entity.entityType === "pipe";
}
