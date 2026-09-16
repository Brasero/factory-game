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
  // Seules les entrees acceptees comptent : un tapis refuse par son receveur ne cree pas de jonction.
  const incoming = new Map<string, number>();
  const connections = world.conveyors.map(source => outputDirections(source).map(direction => {
    const key = positionKey(nextPosition(source, direction));
    const target = occupied.get(key);
    if (target?.kind !== "belt") return {key, target};
    if (!acceptsInput(world.conveyors[target.index], source)) return {key, target: undefined};
    incoming.set(key, (incoming.get(key) ?? 0) + 1);
    return {key, target};
  }));
  const outputs = connections.map(ports => ports.map(({key, target}) => {
    // Seul un merger autorise plusieurs arrivees sur une meme case.
    if (target?.kind === "belt" && world.conveyors[target.index].type !== "merger" && incoming.get(key)! > 1) return undefined;
    return target;
  }));
  return {
    targets: outputs.map(targets => targets[0]),
    outputs,
    machineOutputs: world.machines.map(m => {
      const pump = m.type === "water-pump";
      const target = occupied.get(positionKey({x: m.x + (pump ? 1 : 0), y: m.y + (pump ? 0 : 1)}));
      if (target?.kind !== "belt") return undefined;
      return acceptsInput(world.conveyors[target.index], m) ? target.index : undefined;
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
// Aucun element n'accepte d'entree par sa sortie avant ; un splitter n'accepte que l'arriere.
export function acceptsInput(belt: Conveyor, source: Position): boolean {
  const forward = directions.indexOf(belt.direction);
  const port = inputPort(belt, source);
  return belt.type === "splitter" ? port === (forward + 2) % 4 : port !== forward;
}
