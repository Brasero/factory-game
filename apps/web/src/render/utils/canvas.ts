import type {Position} from "@engine/models/Position.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {World} from "@engine/models/World.ts";
import * as path from "path";
import type {ConveyorPlacement} from "@engine/models/ConveyorPlacement.ts";

export function getLineCells(
  start: Position,
  end: Position
): Position[] {
  const cells: Position[] = [];
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal
    const step = dx >= 0 ? 1 : -1
    for (let x = start.x; x !== end.x + step; x += step) {
      cells.push({x, y: start.y})
    }
  } else {
    // Vertical
    const step = dy >= 0 ? 1 : -1
    for (let y = start.y; y!== end.y + step; y+=step) {
      cells.push({x: start.x, y})
    }
  }
  
  return cells;
}

export function getConveyorsDirection (
  from: Position,
  to: Position
): DirectionType {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y > from.y) return "down";
  return "up";
}

export function buildConveyorLine(
  cells: Position[]
): {x: number, y: number, direction: DirectionType}[] {
  const result = [];
  
  for (let i = 0; i < cells.length; i++) {
    const lastItem = i === cells.length - 1
    let current: Position;
    let next: Position;
    if (lastItem) {
      current = cells[i-1];
      next = cells[i]
      result.push({
        x: next.x,
        y: next.y,
        direction: getConveyorsDirection(current, next)
      })
    } else {
      current = cells[i];
      next = cells[i + 1];
      result.push({
        x: current.x,
        y: current.y,
        direction: getConveyorsDirection(current, next)
      })
    }
    
  }
  return result
}

function buildLPath(
    start: Position,
    end: Position,
    horizontalFirst: boolean
): Position[] {
  let pivot: Position;
  if (horizontalFirst) {
    pivot = {x: end.x, y: start.y}
  } else {
    pivot = {x: start.x, y: end.y }
  }
  return [
    ...getLineCells(start, pivot),
    ...getLineCells(pivot, end).slice(1)
  ]
}

function isPathValid(
    path: Position[],
    world: World
): boolean {
  return path.every(p =>
    world.grid!.canPlaceMachine(p, "conveyor", world)
  )
}

export function getBestPath(
    start: Position,
    end: Position,
    world: World
): Position[] {
  const pathA = buildLPath(start, end, true)
  const pathB = buildLPath(start, end, false)

  const isValidA = isPathValid(pathA, world)
  const isValidB = isPathValid(pathB, world)

  if (isValidA && !isValidB) return pathA;
  if (!isValidA && isValidB) return pathB;
  if (isValidA && isValidB) {
    return pathA.length <= pathB.length ? pathA : pathB
  }
  return [];
}

export function buildConveyorPlacements(
    path: Position[]
): ConveyorPlacement[] {
  return path.map((cell,i) => {
    const next = path[i + 1] ?? path[i - 1];
    if (i === path.length - 1) {
      return {
        ...cell,
        direction: getConveyorsDirection(next, cell)
      }
    }
    return {
      ...cell,
      direction: getConveyorsDirection(cell, next)
    }
  })
}