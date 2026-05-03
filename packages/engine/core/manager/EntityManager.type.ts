import type { MachineType } from "@engine/models/Machine";
import type {World} from "@engine/models/World";
import type {DirectionType} from "@engine/models/Conveyor.ts";

export interface EntityManagerType {
  placeMachine: (x:number, y: number, type: MachineType, world: World) => World | false;
  placeConveyor: (x: number, y: number, direction: DirectionType, world: World) => World | false;
  placeStorage: (x: number, y: number, world: World) => World | false;
  destroyEntityAt: (x: number, y: number, world: World) => World;
}