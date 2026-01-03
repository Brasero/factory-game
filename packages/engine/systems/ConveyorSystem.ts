import {World} from "@engine/models/World";
import {DirectionType} from "../models/Conveyor";
import {Position} from "../models/Position";
import {ResourcesType} from "../models/Resources";

export function runConveyors(world: World) {
  world.conveyors.forEach(conveyor => {
    if (!conveyor.carrying) return;
    
    const targetPos = getNextPosition(conveyor.x, conveyor.y, conveyor.direction);
    const findCallback = (i: Partial<Position>) =>
      i.x === targetPos.x && i.y === targetPos.y;
    
    const targetMachine = world.machines.find(findCallback);
    const targetStorage = world.storages.find(findCallback);
    const targetConveyor = world.conveyors.find(findCallback);
    
    const { type, amount } = conveyor.carrying;
    
    // ============================
    // 1. Vérifier si la cible peut recevoir
    // ============================
    let canTransfer = false;
    
    if (targetMachine) {
      const stored = targetMachine.buffer?.[type] || 0;
      canTransfer = stored < targetMachine.capacity;
    } else if (targetStorage) {
      const stored = targetStorage.stored[type] || 0;
      canTransfer = stored < targetStorage.capacity;
    } else if (targetConveyor) {
      canTransfer = !targetConveyor.carrying;
    }
    
    // ❌ Bloqué → on n'avance PAS
    if (!canTransfer) return;
    
    // ============================
    // 2. Avancer la ressource
    // ============================
    conveyor.carrying.progress = Math.min(
      conveyor.carrying.progress + 0.1,
      1
    );
    
    if (conveyor.carrying.progress < 1) return;
    
    // ============================
    // 3. Transfert réel
    // ============================
    if (targetMachine) {
      targetMachine.buffer = targetMachine.buffer || {} as Record<ResourcesType, number>;
      targetMachine.buffer[type] = (targetMachine.buffer[type] || 0) + amount;
      conveyor.carrying = undefined;
      
    } else if (targetStorage) {
      const stored = targetStorage.stored[type] || 0;
      const space = targetStorage.capacity - stored;
      const moved = Math.min(space, amount);
      
      targetStorage.stored[type] = stored + moved;
      conveyor.carrying.amount -= moved;
      
      if (conveyor.carrying.amount <= 0) {
        conveyor.carrying = undefined;
      }
      
    } else if (targetConveyor) {
      targetConveyor.carrying = {
        ...conveyor.carrying,
        progress: 0
      };
      conveyor.carrying = undefined;
    }
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