import type {GridSnapshot} from "./types";
import type {TileData, SubTileData} from "@engine/models/Tile";
import type {ResourcesType} from "@engine/models/Resources";

type PackedTile = Omit<TileData, "subTiles"> & {subTiles?: number[]};
export type SavedTerrain = {width: number; height: number; palette: (PackedTile | TileData)[]; subTiles?: SubTileData[]; rows: number[][];
  resources: {x: number; y: number; resource: ResourcesType}[]; decorations: {x: number; y: number; type: string; variant: number}[]};
const cache = new WeakMap<GridSnapshot, SavedTerrain>();

/** Palette + répétitions : la mer n'est pas réécrite 47 500 fois dans localStorage. */
export function packTerrain(grid: GridSnapshot): SavedTerrain {
  const cached = cache.get(grid);
  if (cached) return cached;
  const palette: PackedTile[] = [], subTiles: SubTileData[] = [], subIndices = new Map<string, number>(), indices = new Map<string, number>(), rows: number[][] = [], decorations: SavedTerrain["decorations"] = [];
  grid.tiles.forEach((row, y) => {
    const runs: number[] = [];
    row.forEach((source, x) => {
      const {decoration, ...tile} = source;
      if (decoration) decorations.push({x, y, ...decoration});
      const key = JSON.stringify(tile);
      let id = indices.get(key);
      if (id === undefined) {
        id = palette.length;
        const {subTiles: parts, ...base} = tile;
        palette.push({...base, ...(parts ? {subTiles: parts.map(part => {
          const partKey = JSON.stringify(part);
          let partId = subIndices.get(partKey);
          if (partId === undefined) {partId = subTiles.length; subTiles.push(part); subIndices.set(partKey, partId);}
          return partId;
        })} : {})});
        indices.set(key, id);
      }
      if (runs.length && runs[runs.length - 2] === id) runs[runs.length - 1]++;
      else runs.push(id, 1);
    });
    rows.push(runs);
  });
  const saved = {width: grid.width, height: grid.height, palette, subTiles, rows, decorations,
    resources: grid.resources.map(node => ({x: node.pos.x, y: node.pos.y, resource: node.resource}))};
  cache.set(grid, saved);
  return saved;
}

export function unpackTerrain(saved: SavedTerrain): TileData[][] {
  const palette: TileData[] = saved.palette.map(({subTiles: parts, ...base}) => ({
    ...base, ...(parts ? {subTiles: parts.map(part => typeof part === "number" ? saved.subTiles![part] : part)} : {})
  }));
  return saved.rows.map(runs => {
    const row: TileData[] = [];
    for (let i = 0; i < runs.length; i += 2) for (let count = 0; count < runs[i + 1]; count++) row.push(palette[runs[i]]);
    return row;
  });
}
