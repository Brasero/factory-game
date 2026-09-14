import type {World} from "@engine/models/World";
import type {Position} from "@engine/models/Position";
import type {DirectionType} from "@engine/models/Conveyor";

export function nextPosition({x, y}: Position, direction: DirectionType): Position {
  switch (direction) {
    case "up": return {x, y: y - 1};
    case "down": return {x, y: y + 1};
    case "left": return {x: x - 1, y};
    case "right": return {x: x + 1, y};
  }
}
export const positionKey = ({x, y}: Position) => `${x},${y}`;
type Target = {kind: "machine" | "storage" | "belt"; index: number};
export interface NetworkTopology {
  targets: (Target | undefined)[];
  machineOutputs: (number | undefined)[];
  beltOrder: number[];
  machineOrder: number[];
}
const spatialOrder = (entities: Position[]) => entities.map((_, i) => i)
  .sort((a, b) => entities[a].y - entities[b].y || entities[a].x - entities[b].x);

// Contains indices only: inventories and capacities always come from the live world.
export function buildNetworkTopology(world: World): NetworkTopology {
  const occupied = new Map<string, Target>();
  world.conveyors.forEach((c, index) => occupied.set(positionKey(c), {kind: "belt", index}));
  world.storages.forEach((s, index) => occupied.set(positionKey(s), {kind: "storage", index}));
  world.machines.forEach((m, index) => occupied.set(positionKey(m), {kind: "machine", index}));
  const incoming = new Map<string, number>();
  const destinations = world.conveyors.map(c => positionKey(nextPosition(c, c.direction)));
  destinations.forEach(key => incoming.set(key, (incoming.get(key) ?? 0) + 1));
  return {
    targets: destinations.map(key => {
      const target = occupied.get(key);
      // Simple belts never merge implicitly, even if a branch is empty.
      return target?.kind === "belt" && incoming.get(key)! > 1 ? undefined : target;
    }),
    machineOutputs: world.machines.map(m => {
      const pump = m.type === "water-pump";
      const target = occupied.get(positionKey({x: m.x + (pump ? 1 : 0), y: m.y + (pump ? 0 : 1)}));
      if (target?.kind !== "belt") return undefined;
      return world.conveyors[target.index].direction === (pump ? "left" : "up") ? undefined : target.index;
    }),
    beltOrder: spatialOrder(world.conveyors),
    machineOrder: spatialOrder(world.machines)
  };
}
