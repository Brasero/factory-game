import type {LogicalBiome} from "@engine/world/helpers/map.helpers.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import type {SubTileData} from "@engine/models/Tile.ts";

export interface GridCell {
  occupied: boolean;
  tile: LogicalBiome;
  variant: number;
  baseVariant?: number;
  subTiles?: SubTileData[];
  resource: ResourcesType | null;
  decoration?: {
    type: string;
    variant: number;
    destructible: boolean;
  };
}
