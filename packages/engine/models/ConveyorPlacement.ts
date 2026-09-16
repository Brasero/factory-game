import type {Position} from "./Position";
import type {DirectionType} from "./Conveyor";

export interface ConveyorPlacement extends Position {
    direction: DirectionType;
}