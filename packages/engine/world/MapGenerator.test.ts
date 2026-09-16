import {describe, expect, it, vi} from "vitest";
import {MapGenerator} from "./MapGenerator";

describe.each([0.05, 0.95])("MapGenerator (random=%s)", (randomValue) => {
  it.each(["grass", "desert", "snow"] as const)("keeps %s shores and coastal beaches consistent", (biome) => {
    vi.spyOn(Math, "random").mockReturnValue(randomValue);
    const tileMap = MapGenerator.generate({
      width: 24,
      height: 24,
      islands: [{
        biome,
        center: {x: 12, y: 12},
        shape: {type: "organique", size: 6},
        clearings: []
      }]
    });

    let shoreTiles = 0;
    for (const row of tileMap.tiles) {
      for (const tile of row) {
        for (const subTile of tile.subTiles ?? []) {
          if (subTile.biome === "sea") {
            expect(subTile.baseVariant).toBeUndefined();
          }
          if (subTile.biome.includes("-shore")) {
            shoreTiles++;
            expect(subTile.baseVariant).toBeUndefined();
          }
        }
      }
    }
    expect(shoreTiles).toBeGreaterThan(0);
    const at = (x: number, y: number) => tileMap.tiles[Math.floor(y / 2)]?.[Math.floor(x / 2)]
      ?.subTiles?.[(y % 2) * 2 + x % 2];
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const sub = at(x, y);
        if (sub?.biome === `${biome}-shore`) {
          expect(sub.variant).toBe((randomValue > 0.9 ? 71 : 49) + (biome === "desert" ? 72 : biome === "snow" ? 144 : 0));
        }
        if (sub?.biome !== biome) continue;
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const neighbor = at(x + dx, y + dy)?.biome ?? "sea";
          expect(neighbor).not.toBe("sea");
          expect(neighbor).not.toContain("-shore");
        }
      }
    }
  });
});
