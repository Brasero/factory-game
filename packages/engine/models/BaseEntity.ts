import {Position} from "./Position";

type EntityType = "conveyor" | "machine" | "storage";

export interface BaseEntity extends Position {
    id: string;
    entityType: EntityType;
}