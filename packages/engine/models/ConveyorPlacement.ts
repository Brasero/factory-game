import {Position} from "./Position";
import {DirectionType} from "./Conveyor";

export interface ConveyorPlacement extends Position {
    direction: DirectionType;
}