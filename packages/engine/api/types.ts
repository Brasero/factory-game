import type {World} from "@engine/models/World.ts";
import type {MachineType} from "@engine/models/Machine.ts";
import type {DirectionType, Conveyor} from "@engine/models/Conveyor.ts";
import type {Position} from "@engine/models/Position.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {SelectedItem, ToolMode, Controls} from "@engine/models/Controls.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import type {ConveyorPlacement} from "@engine/models/ConveyorPlacement.ts";
import type {TileData} from "@engine/models/Tile.ts";

export interface ResourceNodeSnapshot extends TileData {
  resource: ResourcesType;
  pos: {x: number; y: number};
}

export interface GridSnapshot {
  width: number;
  height: number;
  tiles: TileData[][];
  resources: ResourceNodeSnapshot[];
}

export type WorldSnapshot = Omit<World, "grid"> & {grid?: GridSnapshot};

export type {
  World,
  MachineType,
  DirectionType,
  Conveyor,
  Position,
  Storage,
  SelectedItem,
  ToolMode,
  Controls,
  ResourcesType,
  ConveyorPlacement,
  TileData
};

export type PlaceMachineCommand = {
  type: "place-machine";
  x: number;
  y: number;
  machineType: MachineType;
};

export type PlaceConveyorCommand = {
  type: "place-conveyor";
  x: number;
  y: number;
  direction: DirectionType;
};

export type PlaceStorageCommand = {
  type: "place-storage";
  x: number;
  y: number;
};

export type DestroyEntityCommand = {
  type: "destroy-entity";
  x: number;
  y: number;
};

export type EngineCommand =
  | PlaceMachineCommand
  | PlaceConveyorCommand
  | PlaceStorageCommand
  | DestroyEntityCommand;
