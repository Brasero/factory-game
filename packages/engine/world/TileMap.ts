import type {TileData, TileMapType} from "../models/Tile";

export class TileMap {
  public width: number;
  public height: number;
  public tiles: TileMapType
  constructor(
    width: number,
    height: number,
    tiles: TileMapType
  ) {
    this.height = height;
    this.width = width;
    this.tiles = tiles;
  }
  
  get(x: number, y: number): TileData | null {
    return this.tiles[y]?.[x] ?? null;
  }
}