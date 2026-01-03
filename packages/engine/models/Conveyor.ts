import {ResourcesType} from "./Resources";
import type {Machine} from "@engine/models/Machine.ts";

export type DirectionType = "up" | "down" | "left" | "right";

export interface Conveyor extends Machine {
  type: "conveyor";
  direction: DirectionType;
  carrying?: { type: ResourcesType; amount: number, progress: number };
}