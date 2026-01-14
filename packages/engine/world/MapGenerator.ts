import { TileMap } from "./TileMap";
import { TileMapType } from "@engine/models/Tile";
import {BIOME_TILES} from "@web/config/tileset.registry.ts";

export interface MapGeneratorOptions {
  width: number;
  height: number;
  islandCount: number;
  islandSize: number;
}

/* ============================================================
  TYPES
============================================================ */

export type LogicalBiome = "sea" | "grass" | "desert" | "snow" | "grass-beach" | "desert-beach" | "snow-beach";

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

const BEACH_MIN = 4;
const BEACH_MAX = 4;

const BEACH_CLEARING_RADIUS_MIN = 2;
const BEACH_CLEARING_RADIUS_MAX = 4;
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
  map: LogicalBiome[][],
  baseBiome: LogicalBiome,
  x: number,
  y: number,
  corner: "NE" | "NW" | "SE" | "SW",
  type: "toBeach" | "toSea"
) {
  let hasA = true;
  let hasB = true;
  const biome = type === "toBeach" ? baseBiome : `${baseBiome}-beach`;
  switch (corner) {
    case "NE":
      hasA = biomeAt(map, x, y - 1) === biome; // North
      hasB = biomeAt(map, x + 1, y) === biome; // East
      break;
    
    case "NW":
      hasA = biomeAt(map, x, y - 1) === biome; // North
      hasB = biomeAt(map, x - 1, y) === biome; // West
      break;
    
    case "SE":
      hasA = biomeAt(map, x, y + 1) === biome; // South
      hasB = biomeAt(map, x + 1, y) === biome; // East
      break;
    
    case "SW":
      hasA = biomeAt(map, x, y + 1) === biome; // South
      hasB = biomeAt(map, x - 1, y) === biome; // West
      break;
  }
  
  return (hasA && hasB) ?
    biome !== baseBiome ?
      BIOME_TILES[baseBiome].corner[type][corner].primary
    : BIOME_TILES[baseBiome].corner[type][corner].secondary
    :
      biome !== baseBiome ?
      BIOME_TILES[baseBiome].corner[type][corner].secondary
    : BIOME_TILES[baseBiome].corner[type][corner].primary;
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
      const da = DIRS[a];
      const db = DIRS[b];
      const biomeA = biomeAt(map, x + da.dx, y + da.dy);
      const biomeB = biomeAt(map, x + db.dx, y + db.dy);
      const biomeDiag = biomeAt(
        map,
        x + da.dx + db.dx,
        y + da.dy + db.dy
      );
      
      const isWaterA = biomeA === "sea";
      const isWaterB = biomeB === "sea";
      const isWaterDiag = biomeDiag === "sea";
      
      // Cas 1 : eau sur A + B + diagonale
      const fullCorner = isWaterA && isWaterB && isWaterDiag;
      
      // Cas 2 : eau uniquement en diagonale + A ou B
      const diagonalOnly = (!isWaterA && !isWaterB) && isWaterDiag;
      
      if (fullCorner || diagonalOnly) {
        return pickCorner(map, baseBiome, x, y, key, "toSea");
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
  
  
  // Corners → Beach
  for (const { key, a, b } of CORNERS) {
    const da = DIRS[a];
    const db = DIRS[b];
    const biomeA = biomeAt(map, x + da.dx, y + da.dy);
    const biomeB = biomeAt(map, x + db.dx, y + db.dy);
    const biomeDiag = biomeAt(
      map,
      x + da.dx + db.dx,
      y + da.dy + db.dy
    );
    
    const isBeachA = biomeA === `${biome}-beach`;
    const isBeachB = biomeB === `${biome}-beach`;
    const isBeachDiag = biomeDiag === `${biome}-beach`;
    
    // Cas 1 : beach sur A + B + diagonale
    const fullCorner = isBeachA && isBeachB && isBeachDiag;
    
    // Cas 2 : beach uniquement en diagonale
    const diagonalOnly = (!isBeachA && !isBeachB) && isBeachDiag;
    
    if (fullCorner || diagonalOnly) {
      return pickCorner(map, biome, x, y, key, "toBeach");
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
  
  // Center tile
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
  const range = Math.floor(size * 1.3);
  for (let y = -range; y <= range; y++) {
    const n = 1 + Math.floor(Math.random() * 5); // exponent for smoothing
    for (let x = -range; x <= range; x++) {
      const px = cx + x;
      const py = cy + y;
      
      if (!map[py]?.[px]) continue;
      
      const d = smoothSquareDistance(px, py, cx, cy, size, n);
      
      if (d < size) {
        map[py][px] = biome;
      }
    }
  }
  
  applyBeachLayer(map, biome);
  placeBeachClearings(map, cx, cy, size, biome);
}

function applyBeachLayer(
  map: LogicalBiome[][],
  biome: LogicalBiome
) {
  const height = map.length;
  const width = map[0].length;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] !== biome) continue;
      
      const localBeach =
        BEACH_MIN +
        Math.floor(Math.random() * (BEACH_MAX - BEACH_MIN + 1));
      
      const dist = distanceToSeaManhattan(map, x, y, localBeach);
      
      if (dist <= localBeach) {
        map[y][x] = `${biome}-beach` as LogicalBiome;
      }
    }
  }
}

function distanceToSeaManhattan(
  map: LogicalBiome[][],
  x: number,
  y: number,
  max: number
): number {
  for (let d = 1; d <= max; d++) {
    const checks = [
      [x + d, y],
      [x - d, y],
      [x, y + d],
      [x, y - d],
    ];
    
    for (const [cx, cy] of checks) {
      if (biomeAt(map, cx, cy) === "sea") {
        return d;
      }
    }
  }
  return max + 1;
}

// rendu aléatoire de la forme des îles, avec des bords irréguliers
function pseudoNoise(x: number, y: number, seed = 1337): number {
  //value noise cheap
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Distortion de la distance pour des îles plus organiques
function distortedDistance(
  x: number,
  y: number,
  cx: number,
  cy: number,
  size: number
): number {
  const dx = x - cx;
  const dy = y - cy;
  
  const base = Math.sqrt(dx * dx + dy * dy);
  
  const angle = Math.atan2(dy, dx);
  
  const edgeNoise =
    pseudoNoise(
      Math.cos(angle) * size + cx,
      Math.sin(angle) * size + cy
    ) * size * 0.001;
  
  
  return base + edgeNoise;
}

function smoothSquareDistance(
  x: number,
  y: number,
  cx: number,
  cy: number,
  size: number,
  n: number
): number {
  const dx = Math.abs(x - cx) / size;
  const dy = Math.abs(y - cy) / size;
  
  const randN = n + pseudoNoise(x * 0.5, y * 0.5) * 4;
  const squareDist = Math.pow(
    Math.pow(dx, randN) + Math.pow(dy, randN),
    1 / n
  ) * size;
  
  const localNoise =
    pseudoNoise(x * 0.9, y * 0.9) * size * 0.05;
  
  return squareDist;
}

/* ============================================================
  WALKWAY LAYER
============================================================ */
function generateBeachPaths(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  biome: LogicalBiome
) {
  const paths = 1 + Math.floor(Math.random() * 5) + 2;
  
  for (let i = 0; i < paths; i++) {
    const target = findClosestSea(
      map,
      cx + Math.floor(Math.random() * 6 - 3),
      cy + Math.floor(Math.random() * 6 - 3)
    );
    
    
    
    if (target) {
      const walkWay = {
        from: {
          x: cx + Math.floor(Math.random() * 6 - 3),
          y: cy + Math.floor(Math.random() * 6 - 3)
        },
        waypoint: {
          x: target.x + Math.floor(Math.random() * 6 - 3) - Math.floor((target.x - cx) / 4),
          y: cy + Math.floor(Math.random() * 6 - 3)
        },
        to: target
        }
      carveBeachPath(
        map,
        walkWay.from,
        walkWay.waypoint,
        biome
      );
      carveBeachPath(
        map,
        walkWay.waypoint,
        walkWay.to,
        biome
      );
    }
  }
}


function findClosestSea(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  maxDist = 50
): { x: number; y: number } | null {
  for (let d = 1; d < maxDist; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
        
        const x = cx + dx;
        const y = cy + dy;
        
        if (biomeAt(map, x, y) === "sea") {
          return { x, y };
        }
      }
    }
  }
  return null;
}

function carveBeachPath(
  map: LogicalBiome[][],
  from: { x: number; y: number },
  to: { x: number; y: number },
  biome: LogicalBiome
) {
  const steps = Math.max(
    Math.abs(to.x - from.x),
    Math.abs(to.y - from.y)
  );
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (i % 5 === 0) continue;
    const wobble =
      pseudoNoise(from.x + i * 0.8, from.y - i * 0.6) * 2;
    
    const x = Math.round(
      from.x + (to.x - from.x) * t + wobble
    );
    const y = Math.round(
      from.y + (to.y - from.y) * t - wobble
    );
    
    const width = Math.floor(Math.random() * .1) + 1;
    
    for (let dy = -width; dy <= width; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > width) continue;
        
        const px = x + dx;
        const py = y + dy;
        
        if (!map[py]?.[px]) continue;
        
        const current = biomeAt(map, px, py);
        if (current !== "sea") {
          map[py][px] = biome + "-beach" as LogicalBiome;
        }
      }
    }
  }
}

function carveBeachClearing(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  radius: number,
  biome: LogicalBiome
) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const d =
        Math.sqrt(x * x + y * y) +
        Math.random() * 0.8; // bruit léger
      
      if (d <= radius) {
        const px = cx + x;
        const py = cy + y;
        
        if (
          map[py]?.[px] === biome &&
          distanceToSea(map, px, py, radius + 2) > radius
        ) {
          map[py][px] = `${biome}-beach` as LogicalBiome;
        }
      }
    }
  }
}

function placeBeachClearings(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  islandSize: number,
  biome: LogicalBiome
) {
  const clearingCount =
    Math.floor(islandSize / 4) + Math.floor(Math.random() * 2);
  
  const used: { x: number; y: number }[] = [];
  
  for (let i = 0; i < clearingCount; i++) {
    let tries = 0;
    
    while (tries++ < 20) {
      const r = Math.floor(
        BEACH_CLEARING_RADIUS_MIN +
        Math.random() *
        (BEACH_CLEARING_RADIUS_MAX - BEACH_CLEARING_RADIUS_MIN + 1)
      );
      
      const x =
        cx +
        Math.floor((Math.random() * 2 - 1) * (islandSize - r - 3));
      const y =
        cy +
        Math.floor((Math.random() * 2 - 1) * (islandSize - r - 3));
      
      if (map[y]?.[x] !== biome) continue;
      
      // Éviter les chevauchements
      if (
        used.some(p => Math.hypot(p.x - x, p.y - y) < r * 3)
      ) {
        continue;
      }
      
      // Assez loin de la mer
      if (distanceToSea(map, x, y, r + 2) <= r) continue;
      
      carveBeachClearing(map, x, y, r, biome);
      used.push({ x, y });
      break;
    }
  }
}

function distanceToSea(
  map: LogicalBiome[][],
  x: number,
  y: number,
  max: number
): number {
  for (let d = 1; d <= max; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
        
        const cx = x + dx;
        const cy = y + dy;
        
        if (biomeAt(map, cx, cy) === "sea") {
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
      "snow",
      "grass",
      "desert",
      "snow",
      "grass",
      "desert",
      "snow",
      "grass",
      "desert",
      "snow",
    ];
    const margin = 0;
    
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
        let offset = 0;
        if (logical[y][x] === "snow") {
          offset = 2;
        }
        tiles[y][x] = {
          biome: logical[y][x] as LogicalBiome,
          variant: pickTile(logical, x, y),
          decoration:
            logical[y][x] !== "sea" && !logical[y][x].includes("-beach") && Math.random() > 0.9
              ? {
                  type: rand(["tree", "rock"]),
                  variant: offset + Math.floor(Math.random() * 2)
              }
              : undefined
        };
      }
    }
    
    return new TileMap(width, height, tiles);
  }
}