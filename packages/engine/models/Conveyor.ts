import {Position} from "@engine/models/Position";
import {ResourcesType} from "./Resources";

export type DirectionType = "up" | "down" | "left" | "right";

export interface Conveyor extends Position {
  direction: DirectionType;
  carrying?: { type: ResourcesType; amount: number };
}