const grassTiles = {
  center: {
    main: [10, 11, 13, 18, 22, 23],
    beach: [34, 35, 46, 47]
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
  littoral: [58, 59, 70, 71]
};

export const BIOME_TILES = {
  grass: grassTiles,
  desert: offsetBiome(72),
  snow: offsetBiome(144)
};

function offsetBiome(offset: number) {
  const g = grassTiles;
  const applyOffset = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(v => (v as number) + offset)
      : typeof value === "object" && value !== null
        ? Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, applyOffset(v)])
        )
        : (value as number) + offset;
  return applyOffset(g);
}
