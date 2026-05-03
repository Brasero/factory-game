import type {IslandDefinition} from "@engine/models/IslandDefinition.ts";

/* ============================================================
  TYPES
============================================================ */


/**
 * Identifiants logiques de biome utilises pendant la generation.
 * Ce ne sont pas des assets finaux mais des tags semantiques pour
 * choisir les tuiles et les transitions.
 */
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


/**
 * utilitaire de randomisation
 * @param arr tableau d'élèments
 */
export function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * selection aléatoire de tuile si un tableau est passé en paramètre
 * @param value tableau ou valeur unique
 */
export function pickVariant<T>(value: T | T[]): T {
  return Array.isArray(value) ? rand(value) : value;
}

/**
 * Retourne le biome à une position donnée, retourne "sea" par défaut si la position ne correspond à rien
 * @param map Tableau représentant la carte de tiles
 * @param x Position x
 * @param y Position y
 */
export function biomeAt(map: LogicalBiome[][], x: number, y: number): LogicalBiome {
  return map[y]?.[x] ?? "sea";
}

/**
 * Retourne le biome correspondant au identifiant LogicalBiome
 * @param value identifiant LogicalBiome
 */
export function baseBiomeOf(value: LogicalBiome): "grass" | "desert" | "snow" | null {
  if (value === "sea") return null;
  return value
  .replace("-beach", "")
  .replace("-shore", "") as "grass" | "desert" | "snow";
}

/**
 * Retourne le nom du biome le plus proche, retourne null si rien n'est trouvé
 * @param map Tableau représentant la Map
 * @param x Position x de la tuile de départ
 * @param y Position y de la tuile de départ
 * @param maxDist Distance maximale de recherche
 */
export function findNearestLandBiome(
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

export function isSea(value: LogicalBiome): boolean {
  return value === "sea";
}

export function isSeaLike(value: LogicalBiome): boolean {
  return value === "sea" || value.includes("-shore");
}

/**
 * retourne une copie du tableau IslandDefinition passé en paramètre après avoir appliqué une mise à l'échelle des dimensions
 * @param island Tableau IslandDefinition initial
 * @param scale Echelle à appliquer
 */
export function scaleIslandDefinition(
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