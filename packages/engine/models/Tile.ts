export type BiomeType = "sea" | "grass" | "desert" | "snow";

/**
 * @interface TileData
 * @property biome BiomeType
 * @property variant number
 * @property decoration number
 */
export interface TileData {
  biome: BiomeType;
  variant: number;
  decoration?: number;
}

export type TileMapType = TileData[][];
export const TILE_SIZE = 16;