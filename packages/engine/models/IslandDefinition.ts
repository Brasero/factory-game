import {LogicalBiome} from "../world/MapGenerator";
import {ClearingDefinition} from "./ClearingDefinition";

export type IslandDefinition = {
  biome: LogicalBiome;
  
  shape: {
    type: "organique" | "smoothSquare";
    size: number;
  }
  
  clearings: ClearingDefinition[];
}