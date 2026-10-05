import type {Position} from "./Position";

type EntityType = "conveyor" | "pipe" | "machine" | "storage" | "tunnel";

export interface BaseEntity extends Position {
    id: string;
    entityType: EntityType;
}
