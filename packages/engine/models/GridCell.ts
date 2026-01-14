import type {LogicalBiome} from "@engine/world/MapGenerator.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";

export interface GridCell {
  occupied: boolean;
  tile: LogicalBiome;
  variant: number;
  resource: ResourcesType | null;
  decoration?: {
    type: string;
    variant: number;
    destructible: boolean;
  };
}