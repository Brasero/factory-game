import type {World} from "@engine/models/World";
import type {Position} from "@engine/models/Position";
import type {Conveyor, DirectionType} from "@engine/models/Conveyor";

export function nextPosition({x, y}: Position, direction: DirectionType): Position {
  switch (direction) {
    case "up": return {x, y: y - 1};
    case "down": return {x, y: y + 1};
    case "left": return {x: x - 1, y};
    case "right": return {x: x + 1, y};
  }
}
export const positionKey = ({x, y}: Position) => `${x},${y}`;
export type Target = {kind: "machine" | "storage" | "belt"; index: number};
export interface NetworkTopology {
  targets: (Target | undefined)[];
  outputs: (Target | undefined)[][];
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
  const destinations = world.conveyors.map(c => outputDirections(c).map(direction => nextPosition(c, direction)));
  destinations.flat().forEach(pos => {
    const key = positionKey(pos);
    incoming.set(key, (incoming.get(key) ?? 0) + 1);
  });
  const outputs = destinations.map((positions, index) => positions.map(pos => {
    const target = occupied.get(positionKey(pos));
    if (target?.kind === "belt") {
      const receiver = world.conveyors[target.index];
      if (!acceptsInput(receiver, world.conveyors[index])) return undefined;
      // Seul un merger autorise plusieurs arrivees sur une meme case.
      if (receiver.type !== "merger" && incoming.get(positionKey(pos))! > 1) return undefined;
    }
    return target;
  }));
  return {
    targets: outputs.map(targets => targets[0]),
    outputs,
    machineOutputs: world.machines.map(m => {
      const pump = m.type === "water-pump";
      const target = occupied.get(positionKey({x: m.x + (pump ? 1 : 0), y: m.y + (pump ? 0 : 1)}));
      if (target?.kind !== "belt") return undefined;
      if (!acceptsInput(world.conveyors[target.index], m)) return undefined;
      return world.conveyors[target.index].direction === (pump ? "left" : "up") ? undefined : target.index;
    }),
    beltOrder: spatialOrder(world.conveyors),
    machineOrder: spatialOrder(world.machines)
  };
}

export const directions: DirectionType[] = ["right", "down", "left", "up"];
export function outputDirections(belt: Conveyor): DirectionType[] {
  const forward = directions.indexOf(belt.direction);
  return belt.type === "splitter"
    ? [belt.direction, directions[(forward + 1) % 4], directions[(forward + 3) % 4]]
    : [belt.direction];
}
export function inputPort(belt: Conveyor, source: Position): number {
  const dx = source.x - belt.x, dy = source.y - belt.y;
  return directions.indexOf(dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up");
}
export function acceptsInput(belt: Conveyor, source: Position): boolean {
  if (belt.type === "conveyor") return true;
  const forward = directions.indexOf(belt.direction);
  const port = inputPort(belt, source);
  return belt.type === "splitter" ? port === (forward + 2) % 4 : port !== forward;
}
