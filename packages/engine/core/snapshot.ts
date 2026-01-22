import type {World} from "@engine/models/World.ts";
import type {GridSnapshot, ResourceNodeSnapshot, TileData, WorldSnapshot} from "@engine/api/types.ts";

export function snapshotWorld(world: World): WorldSnapshot {
  const snapshot = structuredClone(world);
  const gridSnapshot = world.grid ? snapshotGrid(world) : undefined;
  return {
    ...snapshot,
    grid: gridSnapshot,
    conveyors: world.conveyors
  };
}

function snapshotGrid(world: World): GridSnapshot {
  const grid = world.grid!;
  const tiles = Array.from({length: grid.height}, (_, y) =>
    Array.from({length: grid.width}, (_, x) => grid.getTile(x, y)!)
  );
  return {
    width: grid.width,
    height: grid.height,
    tiles,
    resources: grid.getResourceMap().map(node => ({
      biome: node.biome,
      variant: node.variant,
      decoration: node.decoration,
      resource: node.resource,
      pos: node.pos
    })) as ResourceNodeSnapshot[]
  };
}