export interface TileDef {
  x: number;
  y: number;
}

export const TILESET = {
  grass: {
    base: [
      {x: 11, y: 0},
      {x: 10, y: 0},
      {x: 11, y: 1},
      {x: 10, y: 1},
      {x: 9, y: 0},
      {x: 8, y: 0},
      {x: 9, y: 1},
      {x: 8, y: 1}
    ],
  },
  
  beach: {
    base: [
      {x: 11, y: 4},
      {x: 10, y: 4},
      {x: 9, y: 4},
      {x: 8, y: 4},
      {x: 11, y: 5},
      {x: 10, y: 5},
      {x: 9, y: 5},
      {x: 8, y: 5}
    ],
  },
  desert: {
    base: [
      {x: 5, y: 3},
      {x: 4, y: 3}
    ]
  },
  
  snow: {
    base: [
      {x: 5, y: 6},
      {x: 4, y: 6},
      {x: 5, y: 7}
    ],
  }
} as const

export {BIOME_TILES} from "@engine/config/tileset.ts";
