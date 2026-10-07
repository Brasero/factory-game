import type {Machine, MachineType} from "@engine/models/Machine";
import type {Position} from "@engine/models/Position";

export type MachineFootprint = {width: number; height: number};

const FOOTPRINTS: Partial<Record<MachineType, MachineFootprint>> = {
  boiler: {width: 2, height: 1},
  "advanced-assembler": {width: 2, height: 1}
};

export function machineFootprint(type: MachineType): MachineFootprint {
  return FOOTPRINTS[type] ?? {width: 1, height: 1};
}

export function machineFootprintCells(machine: Pick<Machine, "x" | "y" | "type">): Position[] {
  const footprint = machineFootprint(machine.type);
  return Array.from({length: footprint.height}, (_, y) =>
    Array.from({length: footprint.width}, (_, x) => ({x: machine.x + x, y: machine.y + y})))
    .flat();
}

export function machineOccupies(machine: Pick<Machine, "x" | "y" | "type">, position: Position): boolean {
  const footprint = machineFootprint(machine.type);
  return position.x >= machine.x && position.x < machine.x + footprint.width &&
    position.y >= machine.y && position.y < machine.y + footprint.height;
}

export function machineOutputSource(machine: Pick<Machine, "x" | "y" | "type">): Position {
  const footprint = machineFootprint(machine.type);
  if (machine.type === "water-pump") return {x: machine.x, y: machine.y};
  return {x: machine.x + footprint.width - 1, y: machine.y + footprint.height - 1};
}

export function machineOutputPosition(machine: Pick<Machine, "x" | "y" | "type">): Position {
  const source = machineOutputSource(machine);
  return machine.type === "water-pump" ? {x: source.x + 1, y: source.y} : {x: source.x, y: source.y + 1};
}
