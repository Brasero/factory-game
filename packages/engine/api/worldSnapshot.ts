import type {Grid} from "@engine/world/Grid";
import type {World} from "@engine/models/World.ts";
import type {GridSnapshot, ResourceNodeSnapshot, WorldSnapshot} from "@engine/api/types.ts";

const terrainCache = new WeakMap<Grid, {revision: number; snapshot: GridSnapshot}>();

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

export function buildWorldSnapshot(world: World): WorldSnapshot {
  const gridSnapshot = world.grid ? buildGridSnapshot(world) : undefined;
  return {
    tick: world.tick,
    machines: world.machines.map(machine => ({
      ...machine,
      buffer: {...machine.buffer}
    })),
    resources: {...world.resources},
    conveyors: world.conveyors.map(conveyor => ({
      ...conveyor,
      carrying: conveyor.carrying.map(resource => ({...resource}))
    })),
    storages: world.storages.map(storage => ({
      ...storage,
      stored: {...storage.stored}
    })),
    tunnels: world.tunnels.map(tunnel => ({...tunnel, stored: {...tunnel.stored}})),
    campaign: structuredClone(world.campaign),
    grid: gridSnapshot
  };
}

function buildGridSnapshot(world: World): GridSnapshot {
  const grid = world.grid!;
  const cached = terrainCache.get(grid);
  if (cached?.revision === grid.revision) return cached.snapshot;
  const tiles = Array.from({length: grid.height}, (_, y) =>
    Array.from({length: grid.width}, (_, x) => grid.getTile(x, y)!)
  );
  const snapshot: GridSnapshot = freezeDeep({
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
  });
  terrainCache.set(grid, {revision: grid.revision, snapshot});
  return snapshot;
}
