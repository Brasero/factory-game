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

const grassTiles = {
  center: {
    main: [10,11,13,18,22,23],
    beach: [34,35,46,47]
  },
  edge: {
    toBeach: {
      N: 6,
      S: 30,
      E: 19,
      W: 17
    },
    toSea: {
      N: 66,
      S: 42,
      E: 53,
      W: 55
    }
  },
  corner: {
    toBeach: {
      NE: {
        primary: 7,
        secondary: 20
      },
      SE: {
        primary: 31,
        secondary: 8
      },
      NW: {
        primary: 5,
        secondary: 21
      },
      SW: {
        primary: 29,
        secondary: 9
      }
    },
    toSea: {
      NE: {
        primary: 65,
        secondary: 45
      },
      SE: {
        primary: 41,
        secondary: 57
      },
      NW: {
        primary: 67,
        secondary: 44
      },
      SW: {
        primary: 43,
        secondary: 56
      }
    }
  },
  littoral: [58,59,70,71]
}
export const BIOME_TILES = {
  grass: grassTiles,
  desert: offsetBiome(72),
  snow: offsetBiome(144)
}

function offsetBiome( offset) {
  const g = grassTiles;
  const applyOffset = value =>
    Array.isArray(value)
      ? value.map(v => v + offset)
      : typeof value === 'object'
        ? Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, applyOffset(v)])
        )
        : value + offset;
  return applyOffset(g);
}