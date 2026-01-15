import {LogicalBiome} from "../world/MapGenerator";
import {ClearingDefinition} from "./ClearingDefinition";
import type {Position} from "@engine/models/Position.ts";

export type IslandDefinition = {
  biome: LogicalBiome;
  
  center: Position;
  
  shape: {
    type: "organique" | "smoothSquare";
    size: number;
  }
  
  clearings: ClearingDefinition[];
}