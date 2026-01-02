import {Position} from "@engine/models/Position";
import {ResourcesType} from "./Resources";

export interface Storage extends Position {
  capacity: number;
  stored: Record<ResourcesType, number>;
}