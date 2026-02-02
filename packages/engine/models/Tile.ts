import type {LogicalBiome} from "@engine/world/MapGenerator.ts";

/**
 * @interface TileData
 * @property biome BiomeType
 * @property variant number
 * @property decoration number
 */
export interface TileData {
  biome: LogicalBiome;
  variant: number;
  baseVariant?: number;
  subTiles?: SubTileData[];
  decoration?: {
    type: string;
    variant: number;
  };
}

export type TileMapType = TileData[][];
export const TILE_SIZE = 16;

export interface SubTileData {
  biome: LogicalBiome;
  variant: number;
  baseVariant?: number;
}
