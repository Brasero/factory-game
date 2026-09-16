import type {LogicalBiome} from "../world/helpers/map.helpers";
import type {ClearingDefinition} from "./ClearingDefinition";
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