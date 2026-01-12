export interface TileDef {
  x: number;
  y: number;
}

export const TILESET = {
  grass: {
    base: [
      {x: 5, y: 0},
      {x: 4, y: 0}
    ],
  },
  
  beach: {
    base: [
      {x: 5, y: 1},
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