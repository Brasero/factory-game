import { TileMap } from "./TileMap";
import { TileData, TileMapType } from "@engine/models/Tile";
import type { BiomeType } from "@engine/models/Tile";
import {BIOME_TILES} from "@web/config/tileset.registry.ts";

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
/* ============================================================
  TYPES
============================================================ */

type LogicalBiome = "sea" | "grass" | "desert" | "snow" | "grass-beach" | "desert-beach" | "snow-beach";

/* ============================================================
  UTILS
============================================================ */

const DIRS = {
  N: { dx: 0, dy: -1 },
  S: { dx: 0, dy: 1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 }
};

const CORNERS = [
  { key: "NE", a: "N", b: "E" },
  { key: "SE", a: "S", b: "E" },
  { key: "NW", a: "N", b: "W" },
  { key: "SW", a: "S", b: "W" }
] as const;

const BEACH_THICKNESS = 3;

const cornerAlternator = new Map<string, boolean>();

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function biomeAt(map: LogicalBiome[][], x: number, y: number): LogicalBiome {
  return map[y]?.[x] ?? "sea";
}

/* ============================================================
  AUTOTILE PICKER
============================================================ */

function pickCorner(
  biome: LogicalBiome,
  x: number,
  y: number,
  corner: string,
  type: "toBeach" | "toSea"
) {
  const key = `${biome}-${corner}-${type}-${Math.floor(x / 2)}-${Math.floor(y / 2)}`;
  const flip = cornerAlternator.get(key) ?? false;
  cornerAlternator.set(key, !flip);
  
  return !flip
    ? BIOME_TILES[biome].corner[type][corner].secondary
    : BIOME_TILES[biome].corner[type][corner].primary;
}

function pickTile(
  map: LogicalBiome[][],
  x: number,
  y: number
): number {
  const biome = biomeAt(map, x, y);
  if (biome === "sea") return;
  
  
  //beach tile
  if (biome.includes("-beach")) {
    const N = biomeAt(map, x, y - 1) === "sea";
    const S = biomeAt(map, x, y + 1) === "sea";
    const E = biomeAt(map, x + 1, y) === "sea";
    const W = biomeAt(map, x - 1, y) === "sea";
    const baseBiome = biome.replace("-beach", "") as LogicalBiome;
    const tiles = BIOME_TILES[baseBiome];
    // Corners → Sea
    for (const { key, a, b } of CORNERS) {
      // if ((a === "N" && N || a === "S" && S) &&
      //   (b === "E" && E || b === "W" && W)) {
      //   return pickCorner(baseBiome, x, y, key, "toSea");
      // }
      const da = DIRS[a];
      const db = DIRS[b];
      
      if (
        biomeAt(map, x + da.dx, y + da.dy) === `sea` &&
        biomeAt(map, x + db.dx, y + db.dy) === `sea` &&
        biomeAt(map, x + da.dx + db.dx, y + da.dy + db.dy) === `sea`
      ) {
        return pickCorner(baseBiome, x, y, key, "toSea");
      }
    }
    
    // Edges → Sea
    if (N) return tiles.edge.toSea.N;
    if (S) return tiles.edge.toSea.S;
    if (E) return tiles.edge.toSea.E;
    if (W) return tiles.edge.toSea.W;
    return rand(tiles.center.beach);
  }
  const tiles = BIOME_TILES[biome];
  
  
  const N = biomeAt(map, x, y - 1) === `${biome}-beach`;
  const S = biomeAt(map, x, y + 1) === `${biome}-beach`;
  const E = biomeAt(map, x + 1, y) === `${biome}-beach`;
  const W = biomeAt(map, x - 1, y) === `${biome}-beach`;
  console.log(biome, x, y, {N,S,E,W});
  
  
  // Corners → Beach
  for (const { key, a, b } of CORNERS) {
    const da = DIRS[a];
    const db = DIRS[b];
    
    if (
      biomeAt(map, x + da.dx, y + da.dy) === `${biome}-beach` &&
        biomeAt(map, x + db.dx, y + db.dy) === `${biome}-beach` &&
      biomeAt(map, x + da.dx + db.dx, y + da.dy + db.dy) === `${biome}-beach`
    ) {
      return pickCorner(biome, x, y, key, "toBeach");
    }
  }
  if (N) return tiles.edge.toBeach.N;
  if (S) return tiles.edge.toBeach.S;
  if (E) return tiles.edge.toBeach.E;
  if (W) return tiles.edge.toBeach.W;
  const isEdge = (dx: number, dy: number) => {
    return biomeAt(map, x + dx, y + dy) === `${biome}-beach`;
  }
  
  // Edges → Beach
  if (isEdge(0, -1)) return tiles.edge.toBeach.N;
  if (isEdge(0, 1)) return tiles.edge.toBeach.S;
  if (isEdge(1, 0)) return tiles.edge.toBeach.E;
  if (isEdge(-1, 0)) return tiles.edge.toBeach.W;
  
  // Littoral
  //if (Math.random() < 0.04) return rand(tiles.littoral);
  //calc dist between this tile and nearest sea tile
  // const maxBeachDist = 5;
  // const maxLittoralDist = 2;
  // let nearestSeaDist = maxBeachDist + 1;
  // for (let dy = -maxBeachDist; dy <= maxBeachDist; dy++) {
  //   for (let dx = -maxBeachDist; dx <= maxBeachDist; dx++) {
  //     const dist = Math.sqrt(dx * dx + dy * dy);
  //     if (dist > nearestSeaDist) continue;
  //     if (biomeAt(map, x + dx, y + dy) === "sea") {
  //       nearestSeaDist = dist;
  //     }
  //   }
  // }
  // if (nearestSeaDist <= maxLittoralDist) {
  //   const t = 1 - nearestSeaDist / maxLittoralDist;
  //   if (Math.random() < t * 0.3) {
  //     return rand(tiles.littoral);
  //   }
  //
  // }
  
  return rand(tiles.center.main);
}

/* ============================================================
  ISLAND GENERATION
============================================================ */

function carveIsland(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  size: number,
  biome: LogicalBiome
) {
  for (let y = -size; y <= size; y++) {
    for (let x = -size; x <= size; x++) {
      const d =
        Math.sqrt(x * x + y * y) +
        Math.random() * 1.5;
      
      if (d < size) {
        const px = cx + x;
        const py = cy + y;
        if (map[py]?.[px] !== undefined) {
          map[py][px] = biome;
        }
      }
    }
  }
  for (let y = -size; y <= size; y++) {
    for (let x = -size; x <= size; x++) {
      const d =
        Math.sqrt(x * x + y * y)
      
      if (d < size) {
        const px = cx + x;
        const py = cy + y;
        if (map[py]?.[px] !== undefined) {
          const distSea = distanceToSea(map, px, py, BEACH_THICKNESS);
          if (distSea <= BEACH_THICKNESS) {
            map[py][px] = biome + "-beach" as LogicalBiome;
          }
        }
      }
    }
  }
}

function distanceToSea(
  map: LogicalBiome[][],
  x: number,
  y: number,
  max: number
): number {
  for (let d = 0; d < max; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
        if (biomeAt(map, x + dx, y + dy) === "sea") {
          return d;
        }
      }
    }
  }
  return max + 1;
}

/* ============================================================
  MAP GENERATOR
============================================================ */

export class MapGenerator {
  static generate(options: MapGeneratorOptions): TileMap {
    const {width, height,islandSize} = options
    const logical: LogicalBiome[][] = Array.from(
      { length: options.height },
      () => Array(options.width).fill("sea")
    );
    
    const islandBiomes: LogicalBiome[] = [
      "grass",
      "desert",
      "snow"
    ];
    const margin = 5
    
    let cursorX = islandSize + margin;
    let cursorY = islandSize + margin;
    
    for (const biome of islandBiomes) {
      carveIsland(logical, cursorX, cursorY, islandSize, biome);
      cursorX += (islandSize * 2) + margin;
      if (cursorX > width - (islandSize + margin)) {
        cursorX = islandSize + margin;
        cursorY += (islandSize * 2) + margin;
      }
    }
    
    const tiles: TileMapType = [];
    
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = {
          biome: logical[y][x] as BiomeType,
          variant: pickTile(logical, x, y),
          decoration:
            logical[y][x] !== "sea" && !logical[y][x].includes("-beach") && Math.random() > 0.9
              ? Math.floor(Math.random() * 2)
              : undefined
        };
      }
    }
    
    return new TileMap(width, height, tiles);
  }
}