import {World} from "@engine/models/World";
import {Conveyor, DirectionType} from "../models/Conveyor";
import {Position} from "../models/Position";
import {ResourcesType} from "../models/Resources";

export function runConveyors(world: World) {
  world.conveyors.forEach((conveyor, i) => {
    if (!conveyor.carrying.length) return;
    
    const targetPos = getNextPosition(conveyor.x, conveyor.y, conveyor.direction);
    const findAtTarget = (i: Partial<Position>) =>
      i.x === targetPos.x && i.y === targetPos.y;
    
    const targetMachine = world.machines.find(findAtTarget);
    const targetStorage = world.storages.find(findAtTarget);
    const targetConveyor = world.conveyors.find(findAtTarget);
    
    const nextCarrying: typeof conveyor.carrying = [];
    
    conveyor.carrying.forEach((item, i) => {
      let canTransfer = false;
      const offset = .35 * i
      
      if (targetMachine) {
        const stored = targetMachine.buffer?.[item.type] || 0;
        canTransfer = stored < targetMachine.capacity;
      } else if (targetStorage) {
        const stored = targetStorage.stored[item.type] || 0;
        canTransfer = stored < targetStorage.capacity;
      } else if (targetConveyor) {
        canTransfer = canTransfertToConveyor(targetConveyor, world, targetPos);
      }
      
      // 1️⃣ Avancer tant qu’on n’est pas à la fin
      if (item.progress < 1) {
        nextCarrying.push({
          ...item,
          progress: Math.min(item.progress + conveyor.speed, 1 - offset),
        });
        return;
      }
      
      // 2️⃣ Bloqué → on reste
      if (!canTransfer) {
        nextCarrying.push(item);
        return;
      }
      
      // 3️⃣ Transfert réel
      if (targetMachine) {
        targetMachine.buffer ??= {} as Record<ResourcesType, number>;
        targetMachine.buffer[item.type] =
          (targetMachine.buffer[item.type] || 0) + item.amount;
        return;
      }
      
      if (targetStorage) {
        const stored = targetStorage.stored[item.type] || 0;
        const space = targetStorage.capacity - stored;
        const moved = Math.min(space, item.amount);
        
        targetStorage.stored[item.type] = stored + moved;
        
        if (item.amount > moved) {
          nextCarrying.push({
            ...item,
            amount: item.amount - moved,
          });
        }
        return;
      }
      
      if (targetConveyor) {
        transfertToConveyor(targetConveyor, item, world)
        return;
      }
    });
    
    world.conveyors[i] = {
      ...conveyor,
      carrying: nextCarrying
    };
  });
}



function getNextPosition(x: number, y: number, direction: DirectionType): Position {
  switch (direction) {
    case "up":
      y -= 1;
      break;
    case "down":
      y += 1;
      break
    case "right":
      x += 1;
      break;
    case "left":
      x -= 1;
      break
  }
  return {x, y};
}

function countIncomingConveyors(world: World, x: number, y: number): number {
  return world.conveyors.reduce((count, conveyor) => {
    const next = getNextPosition(conveyor.x, conveyor.y, conveyor.direction);
    return count + (next.x === x && next.y === y ? 1 : 0);
  }, 0);
}

export function canTransfertToConveyor(
  target: Conveyor,
  world: World,
  targetPos: Position
): boolean {
  const incoming = countIncomingConveyors(world, targetPos.x, targetPos.y);
  if (incoming > 1) return false;
  return target.carrying.length < target.capacity;
}

export function transfertToConveyor(target: Conveyor, item: {type: ResourcesType, amount: number}, world: World) {
  const index = world.conveyors.findIndex(c => c.id === target.id);
  world.conveyors[index] = {
    ...world.conveyors[index],
    carrying: [
      ...target.carrying,
      {
        ...item,
        progress: 0
      }
    ]
  }
}
