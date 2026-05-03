import { TileMap } from "./TileMap";
import type { TileMapType } from "@engine/models/Tile";
import {BIOME_TILES} from "@engine/config/tileset.ts";
import type {IslandDefinition} from "@engine/models/IslandDefinition.ts";
import type {LogicalBiome} from "@engine/world/helpers/map.helpers.ts";
import {
  rand,
  pickVariant,
  biomeAt,
  baseBiomeOf,
  findNearestLandBiome,
  isSea,
  isSeaLike,
  scaleIslandDefinition
} from "@engine/world/helpers/map.helpers.ts"


/**
 * Options de generation de carte.
 * - width/height sont en tuiles finales (pas la sous-grille interne).
 * - islands est defini dans le meme repere que width/height.
 */
export interface MapGeneratorOptions {
  width: number;
  height: number;
  islands: IslandDefinition[];
}

/* ============================================================
  UTILS (helpers biome + utilitaires grille)
============================================================ */

/**
 * Expression véctoriel des directions
 */

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

/**
 * Épaisseur maximale et minimale des plages
 */
const BEACH_MIN = 3;
const BEACH_MAX = 5;
/**
 * Épaisseur maximale et minimale des côtes
 */
const SHORE_MIN = 1;
const SHORE_MAX = 2;


/**
 * Retire les lacs des iles, lisse les côte
 * @param map Tableau représentant la Map
 */
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

/**
 * Supprime les plages qui ne touchent pas la mer et ne sont pas preservees.
 * Evite les plages isolees au milieu des terres.
 */
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

/**
 * Retire les tuiles plage/shore trop loin de la mer, sauf si preservees.
 * Garde une bande cotiere propre et evite l'eau a l'interieur.
 */
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

/**
 * Restaure les plages preservees apres les passes de nettoyage.
 */
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

/**
 * Convertit biome logique + voisins en variante de tuile concrete.
 * Le resultat est utilisé pour construire le TileMap.
 */
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
    return {biome, variant: 0, baseVariant} as {biome: LogicalBiome; variant: number; baseVariant?: number};
  }
  
  const variant = pickTile(map, x, y);
  let baseVariant: number | undefined;
  const baseBiome = baseBiomeOf(biome);
  if (baseBiome && !biome.includes("-shore")) {
    baseVariant = pickVariant(BIOME_TILES[baseBiome].center.beach);
  }
  
  return {biome, variant, baseVariant};
}

/**
 * Condense une sous-grille de tuiles logiques en un biome parent.
 * Utilise un vote majoritaire sur les sous-tuiles.
 */
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

/**
 * Ferme les petites ruptures de plage pour une cote plus continue.
 */
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
  AUTOTILE PICKER (choix des tuiles de transition)
============================================================ */

/**
 * Selectionne une variante de coin selon les adjacences.
 * type="toBeach" = terre->plage ; type="toSea" = plage->mer.
 */
function pickCorner(
  map: LogicalBiome[][],
  baseBiome: "grass" | "desert" | "snow",
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

/**
 * Choisit un index de tuile pour un biome logique selon ses voisins.
 * Gere les plages, les shores et les bords des biomes de base.
 */
function pickTile(
  map: LogicalBiome[][],
  x: number,
  y: number
): number | void {
  const biome = biomeAt(map, x, y);
  if (biome === "sea") return;
  
  const isBeachOf = (value: LogicalBiome, base: LogicalBiome) =>
    value === `${base}-beach`;
  
  if (biome.includes("-shore")) {
    const baseBiome = biome.replace("-shore", "") as "grass" | "desert" | "snow";
    const tiles = BIOME_TILES[baseBiome].shore;
    return pickVariant(tiles.center);
  }
  
  
  // tuile de plage
  if (biome.includes("-beach")) {
    const N = isSeaLike(biomeAt(map, x, y - 1));
    const S = isSeaLike(biomeAt(map, x, y + 1));
    const E = isSeaLike(biomeAt(map, x + 1, y));
    const W = isSeaLike(biomeAt(map, x - 1, y));
    const baseBiome = biome.replace("-beach", "") as "grass" | "desert" | "snow";
    const tiles = BIOME_TILES[baseBiome];
    // Coins → Mer
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
    
    // Bords → Mer
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
  
  
  // Coins → Plage
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
  
  // Bords → Plage
  if (isEdge(0, -1)) return pickVariant(tiles.edge.toBeach.N);
  if (isEdge(0, 1)) return pickVariant(tiles.edge.toBeach.S);
  if (isEdge(1, 0)) return pickVariant(tiles.edge.toBeach.E);
  if (isEdge(-1, 0)) return pickVariant(tiles.edge.toBeach.W);
  
  // Tuile centrale
  return pickVariant(tiles.center.main);
}

/* ============================================================
  ISLAND GENERATION (peinture des biomes logiques)
============================================================ */

/**
 * Peint une silhouette d'ile bruitée dans la carte logique.
 */
function carveIsland(
  map: LogicalBiome[][],
  cx: number,
  cy: number,
  size: number,
  biome: LogicalBiome
) {
  const range = Math.floor(size * 1.3);
  for (let y = -range; y <= range; y++) {
    const n = 1 + Math.floor(Math.random() * 5); // exposant pour le lissage
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

/**
 * Ajoute une bande de plage le long de la cote pour un biome de base.
 */
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

/**
 * Calcule la distance de Manhattan a la mer la plus proche pour chaque case.
 */
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
/**
 * Bruit simple pour jitter de cote et irregularites d'iles.
 */
function pseudoNoise(x: number, y: number, seed = 1337): number {
  // bruit simple type value noise
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Distortion de la distance pour des îles plus organiques
/**
 * Distord la distance radiale pour des silhouettes d'iles plus organiques.
 */
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


/**
 * Creuse une clairiere circulaire et la marque en plage.
 */
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

/**
 * Place toutes les clairieres d'une ile et retourne l'ensemble preserve.
 */
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

/**
 * Ajoute une bande de shore (eau peu profonde) autour des terres.
 */
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

/**
 * Approxime la distance a la mer dans un rayon maximum.
 */
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
  MAP GENERATOR (point d'entree public)
============================================================ */

export class MapGenerator {
  static generate(options: MapGeneratorOptions): TileMap {
    const {width, height, islands} = options;
    // Echelle de sous-grille interne pour des cotes plus lisses.
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
    
    // Etape 1 : sculpter les iles dans la sous-grille logique.
    for (const island of scaledIslands) {
      const cursorX = island.center.x;
      const cursorY = island.center.y;
      carveIsland(subLogical, cursorX, cursorY, island.shape.size, island.biome);
    }
    
    // Etape 2 : convertir les mers fermees (lacs) en terre.
    fillEnclosedSeas(subLogical);
    
    // Etape 3 : ajouter les bandes de plage par biome de base.
    applyBeachLayer(subLogical, "grass");
    applyBeachLayer(subLogical, "desert");
    applyBeachLayer(subLogical, "snow");
    
    // Etape 4 : placer et preserver les clairieres de plage.
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
    
    // Etape 5 : fermer les petites ruptures de plage et ajouter le shore.
    closeBeachEdges(subLogical, "grass");
    closeBeachEdges(subLogical, "desert");
    closeBeachEdges(subLogical, "snow");
    
    applyShoreLayer(subLogical);
    // Etape 6 : nettoyage des artefacts plage/shore parasites.
    removeIsolatedBeaches(subLogical, preservedBeaches);
    stripInlandWaterTiles(subLogical, preservedBeaches);
    restorePreservedBeaches(subLogical, preservedBeaches);
    
    // Etape 7 : reduire la sous-grille vers les tuiles finales.
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