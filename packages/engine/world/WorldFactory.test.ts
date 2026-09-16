import {describe, it, expect, vi} from "vitest";
import {createWorld} from "./WorldFactory";
import {config} from "@engine/config/gridConfig";

describe("WorldFactory", () => {
  it("creates a complete empty world with valid terrain", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const world = createWorld();
    expect(world.tick).toBe(0);
    expect(world.grid?.width).toBe(config.WIDTH / config.CELL_SIZE);
    expect(world.grid?.height).toBe(config.HEIGHT / config.CELL_SIZE);
    expect(world.machines).toEqual([]);
    expect(world.conveyors).toEqual([]);
    expect(world.storages).toEqual([]);
    expect(world.resources).toEqual({iron: 0, coal: 0, water: 0, ironPlate: 0});
    const grid = world.grid!;
    expect(grid.getResourceMap().length).toBeGreaterThan(0);
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y)!;
        if (!Number.isFinite(tile.variant)) throw new Error(`Invalid tile at ${x},${y}`);
        if (tile.subTiles?.every(subTile => subTile.biome === "sea" || subTile.biome.includes("-shore"))) {
          expect(tile.biome, `Invalid sea-like collapse at ${x},${y}`).toBe("sea");
        }
      }
    }
  });
});
