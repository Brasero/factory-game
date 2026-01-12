import {TileMap} from "./TileMap";
import {TileData, TileMapType} from "@engine/models/Tile";
import type {BiomeType} from "@engine/models/Tile";

export interface MapGeneratorOptions {
  width: number;
  height: number;
  seed?: number;
}

export class MapGenerator {
  static biomeArray: BiomeType[] = ["beach", "grass", "desert", "snow"]
  static generate(options: MapGeneratorOptions): TileMap {
    const tiles: TileMapType = []
    
    for (let y = 0; y < options.height; y++) {
      tiles[y] = [];
      for(let x = 0; x < options.width; x++) {
        tiles[y][x] = this.generateTile(x, y, options.width, options.height)
      }
    }
    return new TileMap(options.width, options.height, tiles)
  }
  
  static generateTile(x: number, y: number, width: number, height: number): TileData {
    const biome = this.getTileBiome(x, y, width, height)
    return {
      biome,
      variant: Math.floor(Math.random() * 3),
      decoration: Math.random()-.5 < 0 ? Math.floor(Math.random() * 2) : undefined
    }
  }
  
  static getTileBiome(
    x: number,
    y: number,
    width: number,
    height: number
  ): BiomeType {
    
    const distToEdge = Math.min(
      x, y,
      width - 1 - x,
      height - 1 - y
    );
    const maxDist = Math.min(width, height) / 2;
    const t = distToEdge / maxDist;
    
    return this.getBiomeFromDistance(t);
  }
  static getBiomeFromDistance(t: number): BiomeType {
    if (t < .15) return "beach";
    if (t < .40) return "grass";
    if (t < .70) return "desert";
    return "snow"
  }
}