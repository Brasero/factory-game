import type {MachineType, MachineVariant} from "@engine/models/Machine";
import type {World} from "@engine/models/World";
import type {DirectionType} from "@engine/models/Conveyor.ts";

export interface EntityManagerType {
  placeMachine: (x:number, y: number, type: MachineType, world: World, variant?: MachineVariant) => World | false;
  placeConveyor: (x: number, y: number, direction: DirectionType, world: World, type?: "conveyor" | "splitter" | "merger") => World | false;
  placeStorage: (x: number, y: number, world: World) => World | false;
  destroyEntityAt: (x: number, y: number, world: World) => World;
}
