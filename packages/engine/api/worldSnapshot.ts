import type {World} from "@engine/models/World.ts";
import type {GridSnapshot, ResourceNodeSnapshot, WorldSnapshot} from "@engine/api/types.ts";

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
    grid: gridSnapshot
  };
}

function buildGridSnapshot(world: World): GridSnapshot {
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
