import {World} from "../models/World";
import {ResourcesType} from "../models/Resources";

export function runOutputMachine(world: World) {
  const conveyors = [...world.conveyors];
  
  const machines = world.machines.map(m => {
    const conveyorIndex = world.conveyors.findIndex(c =>
    (c.x === m.x && c.y === m.y + 1 && c.direction !== "up" && !c.carrying && m.type !== "water-pump") || (c.x === m.x + 1 && c.y === m.y && c.direction !== "left" && !c.carrying && m.type === "water-pump"));
    if (conveyorIndex === -1) return m;
    
    //Trouver une ressource disponible dans le buffer de la machine
    const entry = Object.entries(m.buffer).find(([,amount]) => amount > 0)
    
    if (!entry) return m;
    
    const [resources, amount] = entry as [ResourcesType, number];
    conveyors[conveyorIndex] = {
      ...conveyors[conveyorIndex],
      carrying: {
        type: resources,
        amount: 1,
        progress: 0
      }
    }
    
    return {
      ...m,
      buffer: {
        ...m.buffer,
        [resources]: amount - 1
      }
    }
    
  });
  return {...world, machines, conveyors};
}