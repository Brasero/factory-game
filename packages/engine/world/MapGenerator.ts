import { TileMap } from "./TileMap";
import { TileData, TileMapType } from "@engine/models/Tile";
import type { BiomeType } from "@engine/models/Tile";

export interface MapGeneratorOptions {
  width: number;
  height: number;
  islandCount: number;
  islandSize: number;
  mainBiome: BiomeType;
}

type Island = {
  cx: number;
  cy: number;
  size: number;
  mainBiome: BiomeType
}

export class MapGenerator {
  static generate(options: MapGeneratorOptions): TileMap {
    const tiles: TileMapType = [];
    
    // 1️⃣ Initialiser en eau
    for (let y = 0; y < options.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < options.width; x++) {
        tiles[y][x] = { biome: "water", variant: 0 };
      }
    }
    
    // 2️⃣ Créer les îles
    const islands = this.generateIslands(options);
    
    for (const island of islands) {
      this.applyIsland(tiles, island);
    }
    
    // 3️⃣ Arbres
    this.spawnTrees(tiles);
    
    return new TileMap(options.width, options.height, tiles);
  }
  
  // 🌴 Génère les îles
  static generateIslands(options: MapGeneratorOptions): Island[] {
    return Array.from({ length: options.islandCount }).map(() => ({
      cx: Math.floor(Math.random() * options.width),
      cy: Math.floor(Math.random() * options.height),
      size: options.islandSize * (0.8 + Math.random() * 0.4),
      mainBiome: options.mainBiome,
    }));
  }
  
  // 🏝️ Applique une île sur la map
  static applyIsland(tiles: TileMapType, island: Island) {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const dx = Math.abs(x - island.cx);
        const dy = Math.abs(y - island.cy);
        
        // 💡 forme carrée avec coins arrondis
        const dist =
          Math.max(dx, dy) +
          Math.min(dx, dy) * 0.35 +
          Math.random() * 0.3;
        
        if (dist > island.size) continue;
        
        const edge = island.size - dist;
        
        // 🏖️ sable
        if (edge < 2.5) {
          tiles[y][x] = { biome: "beach", variant: rand(2) };
          continue;
        }
        
        // 🌱 clusters secondaires
        const biome =
          Math.random() < 0.12
            ? this.randomSecondaryBiome(island.mainBiome)
            : island.mainBiome;
        
        tiles[y][x] = {
          biome,
          variant: rand(3),
        };
      }
    }
  }
  
  // 🌳 Arbres
  static spawnTrees(tiles: TileMapType) {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        const tile = tiles[y][x];
        if (
          tile.biome === "sand" ||
          tile.biome === "water"
        )
          continue;
        
        if (Math.random() < 0.08) {
          tile.decoration = 0;
        }
      }
    }
  }
  
  static randomSecondaryBiome(main: BiomeType): BiomeType {
    const biomes: BiomeType[] = ["grass", "desert", "snow"]
    const options: BiomeType[] = biomes.filter(
      b => b !== main
    );
    return options[rand(options.length)];
  }
}

const rand = (n: number) => Math.floor(Math.random() * n);