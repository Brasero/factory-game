import type {World} from "@engine/models/World";
import type {DirectionType} from "@engine/models/Conveyor";
import {machineInputSpace} from "@engine/config/recipeConfig";
import {machineFootprintCells, machineOutputPosition} from "@engine/config/machineFootprint";

const DELTA: Record<DirectionType, {x: number; y: number}> = {
  up: {x: 0, y: -1}, down: {x: 0, y: 1}, left: {x: -1, y: 0}, right: {x: 1, y: 0}
};
const key = (x: number, y: number) => `${x},${y}`;

/** Transfers water in two phases so a unit advances at most one pipe per tick. */
export function runPipes(world: World): World {
  const pipes = world.pipes.map(pipe => ({...pipe}));
  const machines = world.machines.map(machine => ({...machine, buffer: {...machine.buffer}}));
  const pipeAt = new Map(pipes.map((pipe, index) => [key(pipe.x, pipe.y), index]));
  const machineAt = new Map(machines.flatMap(machine => machineFootprintCells(machine)
    .map(cell => [key(cell.x, cell.y), machine] as const)));
  const arrivals = pipes.map(() => 0);
  const available = pipes.map(pipe => pipe.capacity - pipe.water);

  // Pumps inject only into a pipe placed on their fixed output, never into a conveyor.
  machines.forEach((machine, machineIndex) => {
    if (machine.type !== "water-pump" || (machine.buffer.water ?? 0) <= 0) return;
    const target = pipeAt.get(key(machine.x + 1, machine.y));
    if (target === undefined || available[target] <= 0) return;
    const moved = Math.min(machine.buffer.water ?? 0, available[target], 1);
    arrivals[target] += moved;
    available[target] -= moved;
    machines[machineIndex].buffer.water = (machine.buffer.water ?? 0) - moved;
  });

  pipes.forEach((pipe, index) => {
    if (pipe.water <= 0) return;
    const delta = DELTA[pipe.direction];
    const tx = pipe.x + delta.x, ty = pipe.y + delta.y;
    const targetPipe = pipeAt.get(key(tx, ty));
    if (targetPipe !== undefined && available[targetPipe] > 0) {
      const moved = Math.min(pipe.water, available[targetPipe], 1);
      pipes[index].water -= moved;
      arrivals[targetPipe] += moved;
      available[targetPipe] -= moved;
      return;
    }
    const targetMachine = machineAt.get(key(tx, ty));
    if (!targetMachine) return;
    const output = machineOutputPosition(targetMachine);
    if (pipe.x === output.x && pipe.y === output.y) return;
    const moved = Math.min(pipe.water, machineInputSpace(targetMachine, "water"), 1);
    if (moved <= 0) return;
    pipes[index].water -= moved;
    targetMachine.buffer.water = (targetMachine.buffer.water ?? 0) + moved;
  });
  pipes.forEach((pipe, index) => { pipe.water += arrivals[index]; });
  return {...world, pipes, machines};
}
