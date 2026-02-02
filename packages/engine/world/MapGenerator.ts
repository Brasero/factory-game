import { TileMap } from "./TileMap";
import { TileMapType } from "@engine/models/Tile";
import {BIOME_TILES} from "@engine/config/tileset.ts";
import type {IslandDefinition} from "@engine/models/IslandDefinition.ts";


/**
 * Options for generating a map.
 * @typedef {Object} MapGeneratorOptions
 * @property {number} width - The width of the map in tiles.
 * @property {number} height - The height of the map in tiles.
 * @property {IslandDefinition[]} islands - An array of island definitions to be placed on the map.
 */
export interface MapGeneratorOptions {
  width: number;
  height: number;
  islands: IslandDefinition[];
}

/* ============================================================
  TYPES
============================================================ */

export type LogicalBiome =
  | "sea"
  | "grass"
  | "desert"
  | "snow"
  | "grass-beach"
  | "desert-beach"
  | "snow-beach"
  | "grass-shore"
  | "desert-shore"
  | "snow-shore";

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

const BEACH_MIN = 3;
const BEACH_MAX = 5;

const BEACH_CLEARING_RADIUS_MIN = 2;
const BEACH_CLEARING_RADIUS_MAX = 4;
const SHORE_MIN = 1;
const SHORE_MAX = 2;
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickVariant<T>(value: T | T[]): T {
  return Array.isArray(value) ? rand(value) : value;
}

function biomeAt(map: LogicalBiome[][], x: number, y: number): LogicalBiome {
  return map[y]?.[x] ?? "sea";
}

function baseBiomeOf(value: LogicalBiome): "grass" | "desert" | "snow" | null {
  if (value === "sea") return null;
  return value
    .replace("-beach", "")
    .replace("-shore", "") as "grass" | "desert" | "snow";
}

function findNearestLandBiome(
  map: LogicalBiome[][],
  x: number,
  y: number,
  maxDist = 2
): "grass" | "desert" | "snow" | null {
  for (let d = 1; d <= maxDist; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
        const biome = baseBiomeOf(biomeAt(map, x + dx, y + dy));
        if (biome) return biome;
      }
    }
  }
  return null;
}

function isSea(value: LogicalBiome): boolean {
  return value === "sea";
}

function isSeaLike(value: LogicalBiome): boolean {
  return value === "sea" || value.includes("-shore");
}

function scaleIslandDefinition(
  island: IslandDefinition,
  scale: number
): IslandDefinition {
  return {
    ...island,
    center: {
      x: island.center.x * scale,
      y: island.center.y * scale
    },
    shape: {
      ...island.shape,
      size: island.shape.size * scale
    },
    clearings: island.clearings.map(clearing => ({
      ...clearing,
      x: clearing.x * scale,
      y: clearing.y * scale,
      radius: clearing.radius * scale
    }))
  };
}

function fillEnclosedSeas(map: LogicalBiome[][]) {
  const height = map.length;
  const width = map[0].length;
  const openSea: boolean[][] = Array.from({length: height}, () =>
    Array(width).fill(false)
  );
  const queue: Array<{x: number; y: number}> = [];
  
  for (let x = 0; x < width; x++) {
    if (isSea(map[0]?.[x])) {
      openSea[0][x] = true;
      queue.push({x, y: 0});
    }
    if (isSea(map[height - 1]?.[x])) {
      openSea[height - 1][x] = true;
      queue.push({x, y: height - 1});
    }
  }
  for (let y = 0; y < height; y++) {
    if (isSea(map[y]?.[0])) {
      openSea[y][0] = true;
      queue.push({x: 0, y});
    }
    if (isSea(map[y]?.[width - 1])) {
      openSea[y][width - 1] = true;
      queue.push({x: width - 1, y});
    }
  }
  
  let head = 0;
  while (head < queue.length) {
    const {x, y} = queue[head++];
    for (const {dx, dy} of Object.values(DIRS)) {
      const nx = x + dx;
      const ny = y + dy;
      if (!map[ny]?.[nx]) continue;
      if (!isSea(map[ny][nx])) continue;
      if (openSea[ny][nx]) continue;
      openSea[ny][nx] = true;
      queue.push({x: nx, y: ny});
    }
  }
  
  const visited: boolean[][] = Array.from({length: height}, () =>
    Array(width).fill(false)
  );
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isSea(map[y][x]) || openSea[y][x] || visited[y][x]) continue;
      
      const region: Array<{x: number; y: number}> = [];
      const biomeCounts: Record<"grass" | "desert" | "snow", number> = {
        grass: 0,
        desert: 0,
        snow: 0
      };
      const q: Array<{x: number; y: number}> = [{x, y}];
      visited[y][x] = true;
      
      let qi = 0;
      while (qi < q.length) {
        const cell = q[qi++];
        region.push(cell);
        
        for (const {dx, dy} of Object.values(DIRS)) {
          const nx = cell.x + dx;
          const ny = cell.y + dy;
          if (!map[ny]?.[nx]) continue;
          
          if (isSea(map[ny][nx]) && !openSea[ny][nx] && !visited[ny][nx]) {
            visited[ny][nx] = true;
            q.push({x: nx, y: ny});
            continue;
          }
          
          const neighborBiome = baseBiomeOf(map[ny][nx]);
          if (neighborBiome) {
            biomeCounts[neighborBiome]++;
          }
        }
      }
      
      const fillBiome =
        biomeCounts.desert > biomeCounts.grass && biomeCounts.desert >= biomeCounts.snow
          ? "desert"
          : biomeCounts.snow > biomeCounts.grass
            ? "snow"
            : "grass";
      
      for (const cell of region) {
        map[cell.y][cell.x] = fillBiome as LogicalBiome;
      }
    }
  }
}

function removeIsolatedBeaches(
  map: LogicalBiome[][],
  preserved: Set<string>
) {
  const height = map.length;
  const width = map[0].length;
  const visited: boolean[][] = Array.from({length: height}, () =>
    Array(width).fill(false)
  );
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const biome = map[y][x];
      if (!biome.includes("-beach") || visited[y][x]) continue;
      
      const region: Array<{x: number; y: number}> = [];
      let touchesSea = false;
      let hasPreserved = false;
      const q: Array<{x: number; y: number}> = [{x, y}];
      visited[y][x] = true;
      
      let qi = 0;
      while (qi < q.length) {
        const cell = q[qi++];
        region.push(cell);
        if (preserved.has(`${cell.x},${cell.y}`)) {
          hasPreserved = true;
        }
        
        for (const {dx, dy} of Object.values(DIRS)) {
          const nx = cell.x + dx;
          const ny = cell.y + dy;
          if (!map[ny]?.[nx]) continue;
          const neighbor = map[ny][nx];
          
          if (isSeaLike(neighbor)) {
            touchesSea = true;
          } else if (neighbor.includes("-beach") && !visited[ny][nx]) {
            visited[ny][nx] = true;
            q.push({x: nx, y: ny});
          }
        }
      }
      
      if (!touchesSea && !hasPreserved) {
        for (const cell of region) {
          const base = baseBiomeOf(map[cell.y][cell.x]);
          map[cell.y][cell.x] = (base ?? "grass") as LogicalBiome;
        }
      }
    }
  }
}

function stripInlandWaterTiles(
  map: LogicalBiome[][],
  preserved: Set<string>
) {
  const height = map.length;
  const width = map[0].length;
  const distToSea = computeDistanceToSea(map);
  const coastBand = BEACH_MAX + SHORE_MAX;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const biome = map[y][x];
      if (biome === "sea") continue;
      if (!biome.includes("-beach") && !biome.includes("-shore")) continue;
      if (distToSea[y][x] <= coastBand) continue;
      if (preserved.has(`${x},${y}`)) continue;
      
      const base = baseBiomeOf(biome);
      map[y][x] = (base ?? "grass") as LogicalBiome;
    }
  }
}

function restorePreservedBeaches(
  map: LogicalBiome[][],
  preserved: Set<string>
) {
  for (const key of preserved) {
    const [xStr, yStr] = key.split(",");
    const x = Number(xStr);
    const y = Number(yStr);
    if (!map[y]?.[x]) continue;
    
    let base = baseBiomeOf(map[y][x]);
    if (!base) {
      base = findNearestLandBiome(map, x, y, 3);
    }
    if (base) {
      map[y][x] = `${base}-beach` as LogicalBiome;
    }
  }
}

function buildTileData(
  map: LogicalBiome[][],
  x: number,
  y: number
): {biome: LogicalBiome; variant: number; baseVariant?: number} {
  const biome = biomeAt(map, x, y);
  if (biome === "sea") {
    const nearLand = findNearestLandBiome(map, x, y, 2);
    const baseVariant =
      nearLand && Math.random() > 0.9
        ? pickVariant(BIOME_TILES[nearLand].littoral)
        : undefined;
    return {biome, variant: 0, baseVariant};
  }
  
  const variant = pickTile(map, x, y);
  let baseVariant: number | undefined;
  const baseBiome = baseBiomeOf(biome);
  if (baseBiome && !biome.includes("-shore")) {
    baseVariant = pickVariant(BIOME_TILES[baseBiome].center.beach);
  }
  
  return {biome, variant, baseVariant};
}

function collapseBiome(subTiles: Array<{biome: LogicalBiome}>): LogicalBiome {
  const counts = {
    grass: 0,
    desert: 0,
    snow: 0
  };
  
  for (const tile of subTiles) {
    const base = baseBiomeOf(tile.biome);
    if (base) counts[base]++;
  }
  
  if (counts.grass === 0 && counts.desert === 0 && counts.snow === 0) {
    return "sea";
  }
  
  if (counts.desert > counts.grass && counts.desert >= counts.snow) {
    return "desert";
  }
  if (counts.snow > counts.grass) {
    return "snow";
  }
  return "grass";
}

function closeBeachEdges(
  map: LogicalBiome[][],
  baseBiome: "grass" | "desert" | "snow"
) {
  const height = map.length;
  const width = map[0].length;
  const distToSea = computeDistanceToSea(map);
  const maxDist = BEACH_MAX + 1;
  const beachTag = `${baseBiome}-beach`;
  
  const isBeach = (x: number, y: number) => map[y]?.[x] === beachTag;
  const isLand = (x: number, y: number) =>
    baseBiomeOf(map[y][x]) === baseBiome &&
    !map[y][x].includes("-shore");
  
  const dilated: boolean[][] = Array.from({length: height}, () =>
    Array(width).fill(false)
  );
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isLand(x, y) || distToSea[y][x] > maxDist) continue;
      if (isBeach(x, y)) {
        dilated[y][x] = true;
        continue;
      }
      let neighborBeach = false;
      for (const {dx, dy} of Object.values(DIRS)) {
        if (isBeach(x + dx, y + dy)) {
          neighborBeach = true;
          break;
        }
      }
      if (neighborBeach) dilated[y][x] = true;
    }
  }
  
  const closed: boolean[][] = Array.from({length: height}, () =>
    Array(width).fill(false)
  );
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!dilated[y][x]) continue;
      let count = 0;
      for (const {dx, dy} of Object.values(DIRS)) {
        if (dilated[y + dy]?.[x + dx]) count++;
      }
      if (count >= 2) closed[y][x] = true;
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isLand(x, y) || distToSea[y][x] > maxDist) continue;
      map[y][x] = closed[y][x] ? (beachTag as LogicalBiome) : baseBiome;
    }
  }
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
  
  const pickPrimary = () =>
    pickVariant(BIOME_TILES[baseBiome].corner[type][corner].primary);
  const pickSecondary = () =>
    pickVariant(BIOME_TILES[baseBiome].corner[type][corner].secondary);
  
  return (hasA && hasB)
    ? biome !== baseBiome
      ? pickPrimary()
      : pickSecondary()
    : biome !== baseBiome
      ? pickSecondary()
      : pickPrimary();
}

function pickTile(
  map: LogicalBiome[][],
  x: number,
  y: number
): number {
  const biome = biomeAt(map, x, y);
  if (biome === "sea") return;
  
  const isBeachOf = (value: LogicalBiome, base: LogicalBiome) =>
    value === `${base}-beach`;
  
  if (biome.includes("-shore")) {
    const baseBiome = biome.replace("-shore", "") as "grass" | "desert" | "snow";
    const tiles = BIOME_TILES[baseBiome].shore;
    return pickVariant(tiles.center);
  }
  
  
  //beach tile
  if (biome.includes("-beach")) {
    const N = isSeaLike(biomeAt(map, x, y - 1));
    const S = isSeaLike(biomeAt(map, x, y + 1));
    const E = isSeaLike(biomeAt(map, x + 1, y));
    const W = isSeaLike(biomeAt(map, x - 1, y));
    const baseBiome = biome.replace("-beach", "") as "grass" | "desert" | "snow";
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
      
      const isWaterA = isSeaLike(biomeA);
      const isWaterB = isSeaLike(biomeB);
      const isWaterDiag = isSeaLike(biomeDiag);
      
      // Cas 1 : eau sur A + B + diagonale
      const fullCorner = isWaterA && isWaterB && isWaterDiag;
      
      // Cas 2 : eau uniquement en diagonale + A ou B
      const diagonalOnly = (!isWaterA && !isWaterB) && isWaterDiag;
      
      if (fullCorner || diagonalOnly) {
        return pickCorner(map, baseBiome, x, y, key, "toSea");
      }
    }
    
    // Edges → Sea
    if (N) return pickVariant(tiles.edge.toSea.N);
    if (S) return pickVariant(tiles.edge.toSea.S);
    if (E) return pickVariant(tiles.edge.toSea.E);
    if (W) return pickVariant(tiles.edge.toSea.W);
    return pickVariant(tiles.center.beach);
  }
  const tiles = BIOME_TILES[biome as "grass" | "desert" | "snow"];
  
  
  const N = isBeachOf(biomeAt(map, x, y - 1), biome);
  const S = isBeachOf(biomeAt(map, x, y + 1), biome);
  const E = isBeachOf(biomeAt(map, x + 1, y), biome);
  const W = isBeachOf(biomeAt(map, x - 1, y), biome);
  
  
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
  if (N) return pickVariant(tiles.edge.toBeach.N);
  if (S) return pickVariant(tiles.edge.toBeach.S);
  if (E) return pickVariant(tiles.edge.toBeach.E);
  if (W) return pickVariant(tiles.edge.toBeach.W);
  const isEdge = (dx: number, dy: number) => {
    return isBeachOf(biomeAt(map, x + dx, y + dy), biome);
  }
  
  // Edges → Beach
  if (isEdge(0, -1)) return pickVariant(tiles.edge.toBeach.N);
  if (isEdge(0, 1)) return pickVariant(tiles.edge.toBeach.S);
  if (isEdge(1, 0)) return pickVariant(tiles.edge.toBeach.E);
  if (isEdge(-1, 0)) return pickVariant(tiles.edge.toBeach.W);
  
  // Center tile
  return pickVariant(tiles.center.main);
}

/* ============================================================
  ISLAND GENERATION
============================================================ */

function carveIsland(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  size: number,
  biome: LogicalBiome,
  clearings: IslandDefinition["clearings"]
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
}

function applyBeachLayer(
  map: LogicalBiome[][],
  biome: LogicalBiome
) {
  const height = map.length;
  const width = map[0].length;
  const distToSea = computeDistanceToSea(map);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] !== biome) continue;
      
      const noise =
        pseudoNoise(x * 0.15, y * 0.15) * (BEACH_MAX - BEACH_MIN + 1);
      const localBeach = BEACH_MIN + Math.floor(noise);
      
      const dist = distToSea[y][x];
      
      if (dist <= localBeach) {
        map[y][x] = `${biome}-beach` as LogicalBiome;
      }
    }
  }
}

function computeDistanceToSea(map: LogicalBiome[][]): number[][] {
  const height = map.length;
  const width = map[0].length;
  const dist: number[][] = Array.from({length: height}, () =>
    Array(width).fill(Infinity)
  );
  const queue: Array<{x: number; y: number}> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] === "sea") {
        dist[y][x] = 0;
        queue.push({x, y});
      }
    }
  }
  
  let head = 0;
  while (head < queue.length) {
    const {x, y} = queue[head++];
    const current = dist[y][x];
    
    for (const {dx, dy} of Object.values(DIRS)) {
      const nx = x + dx;
      const ny = y + dy;
      if (!map[ny]?.[nx]) continue;
      
      const next = current + 1;
      if (next < dist[ny][nx]) {
        dist[ny][nx] = next;
        queue.push({x: nx, y: ny});
      }
    }
  }
  
  return dist;
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
  biome: LogicalBiome,
  preserved?: Set<string>
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
          preserved?.add(`${px},${py}`);
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
  biome: LogicalBiome,
  clearings: IslandDefinition["clearings"]
): Set<string> {
  const preserved = new Set<string>();
  
  const used: { x: number; y: number }[] = [];
  
  for (const clearing of clearings) {
    let tries = 0;
    
    while (tries++ < 20) {
      const r = clearing.radius
      
      const x =
        cx + clearing.x;
      const y =
        cy + clearing.y;
      
      if (map[y]?.[x] !== biome) continue;
      
      // Éviter les chevauchements
      if (
        used.some(p => Math.hypot(p.x - x, p.y - y) < r * 3)
      ) {
        continue;
      }
      
      // Assez loin de la mer
      if (distanceToSea(map, x, y, r + 2) <= r) continue;
      
      carveBeachClearing(map, x, y, r, biome, preserved);
      used.push({ x, y });
      break;
    }
  }
  
  return preserved;
}

function applyShoreLayer(map: LogicalBiome[][]) {
  const height = map.length;
  const width = map[0].length;
  const dist: number[][] = Array.from({length: height}, () =>
    Array(width).fill(Infinity)
  );
  const nearestBiome: Array<Array<LogicalBiome | null>> = Array.from(
    {length: height},
    () => Array(width).fill(null)
  );
  
  const queue: Array<{x: number; y: number}> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = map[y][x];
      if (value !== "sea") {
        const base = value
          .replace("-beach", "")
          .replace("-shore", "") as LogicalBiome;
        dist[y][x] = 0;
        nearestBiome[y][x] = base;
        queue.push({x, y});
      }
    }
  }
  
  let head = 0;
  while (head < queue.length) {
    const {x, y} = queue[head++];
    const current = dist[y][x];
    if (current >= SHORE_MAX) continue;
    
    for (const {dx, dy} of Object.values(DIRS)) {
      const nx = x + dx;
      const ny = y + dy;
      if (!map[ny]?.[nx]) continue;
      if (map[ny][nx] !== "sea") continue;
      
      const next = current + 1;
      if (next < dist[ny][nx]) {
        dist[ny][nx] = next;
        nearestBiome[ny][nx] = nearestBiome[y][x];
        queue.push({x: nx, y: ny});
      }
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] !== "sea") continue;
      const base = nearestBiome[y][x];
      if (!base) continue;
      
      const noise =
        pseudoNoise(x * 0.12, y * 0.12) * (SHORE_MAX - SHORE_MIN + 1);
      const localShore = SHORE_MIN + Math.floor(noise);
      if (dist[y][x] <= localShore) {
        map[y][x] = `${base}-shore` as LogicalBiome;
      }
    }
  }
}

function distanceToSea(
  map: LogicalBiome[][],
  x: number,
  y: number,
  max: number,
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
    const {width, height, islands} = options;
    const scale = 2;
    const subWidth = width * scale;
    const subHeight = height * scale;
    const subLogical: LogicalBiome[][] = Array.from(
      { length: subHeight },
      () => Array(subWidth).fill("sea")
    );
    
    const scaledIslands = islands.map(island =>
      scaleIslandDefinition(island, scale)
    );
    
    for (const island of scaledIslands) {
      const cursorX = island.center.x;
      const cursorY = island.center.y;
      carveIsland(subLogical, cursorX, cursorY, island.shape.size, island.biome, island.clearings);
    }
    
    fillEnclosedSeas(subLogical);
    
    applyBeachLayer(subLogical, "grass");
    applyBeachLayer(subLogical, "desert");
    applyBeachLayer(subLogical, "snow");
    
    const preservedBeaches = new Set<string>();
    for (const island of scaledIslands) {
      const preserved = placeBeachClearings(
        subLogical,
        island.center.x,
        island.center.y,
        island.shape.size,
        island.biome,
        island.clearings
      );
      for (const key of preserved) preservedBeaches.add(key);
    }
    
    closeBeachEdges(subLogical, "grass");
    closeBeachEdges(subLogical, "desert");
    closeBeachEdges(subLogical, "snow");
    
    applyShoreLayer(subLogical);
    removeIsolatedBeaches(subLogical, preservedBeaches);
    stripInlandWaterTiles(subLogical, preservedBeaches);
    restorePreservedBeaches(subLogical, preservedBeaches);
    
    const tiles: TileMapType = [];
    
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        const subTiles = [];
        
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const subX = x * scale + sx;
            const subY = y * scale + sy;
            subTiles.push(buildTileData(subLogical, subX, subY));
          }
        }
        
        const biome = collapseBiome(subTiles) as LogicalBiome;
        const hasEdge = subTiles.some(tile =>
          tile.biome.includes("-beach") || tile.biome.includes("-shore")
        );
        const offset = biome === "snow" ? 2 : 0;
        
        tiles[y][x] = {
          biome,
          variant: subTiles[0].variant,
          baseVariant: subTiles[0].baseVariant,
          subTiles,
          decoration:
            biome !== "sea" &&
            !hasEdge &&
            Math.random() > 0.9
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
