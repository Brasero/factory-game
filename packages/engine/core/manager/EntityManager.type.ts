import {Machine, MachineType} from "@engine/models/Machine";
import {World} from "@engine/models/World";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";
import type {Storage} from "@engine/models/Storage.ts";

export interface EntityManagerType {
  placeMachine: (x:number, y: number, type: MachineType, world: World) => World | false;
  placeConveyor: (x: number, y: number, direction: DirectionType, world: World) => World | false;
  placeStorage: (x: number, y: number, world: World) => World | false;
  getEntityAt: (x: number, y: number, world: World) => BaseEntity | null;
  removeMachine: (id: string, world: World) => Machine[];
  removeConveyor: (id: string, world: World) => Conveyor[];
  removeStorage: (id: string, world: World) => Storage[];
  destroyEntityAt: (x: number, y: number, world: World) => World;
}