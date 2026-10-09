import type {World} from "@engine/models/World.ts";
import type {MachineType, MachineVariant} from "@engine/models/Machine.ts";
import type {DirectionType, Conveyor, ConveyorTier, SmartSplitterFilter, SmartSplitterPort} from "@engine/models/Conveyor.ts";
import type {Position} from "@engine/models/Position.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {SelectedItem, ToolMode, Controls} from "@engine/models/Controls.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import type {ConveyorPlacement} from "@engine/models/ConveyorPlacement.ts";
import type {TileData} from "@engine/models/Tile.ts";
import type {RecipeId} from "@engine/config/recipeConfig";
import type {TunnelOutputFilter} from "@engine/models/Tunnel";
import type {Pipe} from "@engine/models/Pipe";

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

export type WorldSnapshot = Omit<World, "grid" | "pipes"> & {grid?: GridSnapshot; pipes?: Pipe[]};

export type {
  World,
  MachineType,
  DirectionType,
  Conveyor,
  SmartSplitterFilter,
  SmartSplitterPort,
  Pipe,
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
  variant?: MachineVariant;
};

export type PlaceConveyorCommand = {
  type: "place-conveyor";
  conveyorType?: Conveyor["type"];
  tier?: ConveyorTier;
  x: number;
  y: number;
  direction: DirectionType;
};

export type PlaceStorageCommand = {
  type: "place-storage";
  kind?: "shipping-depot";
  x: number;
  y: number;
};

export type PlacePipeCommand = {type: "place-pipe"; x: number; y: number; direction: DirectionType};

export type DestroyEntityCommand = {
  type: "destroy-entity";
  x: number;
  y: number;
};
export type DestroyEntitiesCommand = {type: "destroy-entities"; positions: Position[]};

export type ActivateLevelCommand = {type: "activate-level"; levelId: string};
export type FinalizeLevelCommand = {type: "finalize-level"; levelId: string};
export type SelectMachineRecipeCommand = {type: "select-machine-recipe"; machineId: string; recipeId: RecipeId};
export type SetMachinePausedCommand = {type: "set-machine-paused"; machineId: string; paused: boolean};
export type SetSmartSplitterFilterCommand = {type: "set-smart-splitter-filter"; splitterId: string; port: SmartSplitterPort; filter: SmartSplitterFilter};
export type ContinueCampaignCommand = {type: "continue-campaign"};

export type EngineCommand =
  | PlaceMachineCommand
  | PlaceConveyorCommand
  | PlacePipeCommand
  | PlaceStorageCommand
  | DestroyEntityCommand
  | DestroyEntitiesCommand
  | ActivateLevelCommand
  | FinalizeLevelCommand
  | SelectMachineRecipeCommand
  | SetMachinePausedCommand
  | SetSmartSplitterFilterCommand
  | ContinueCampaignCommand
  | {type: "set-conveyor-regulation"; conveyorId: string; outputRate?: number; priorityPort?: SmartSplitterPort}
  | {type: "set-storage-reserve"; storageId: string; reserve: number}
  | {type: "set-tunnel-filter"; tunnelId: string; side: DirectionType; filter: TunnelOutputFilter}
  | {type: "accept-contract" | "cancel-contract"; contractId: string}
  | {type: "assign-contract"; depotId: string; contractId?: string};
