import {World} from "../models/World";

export function runProduction(world: World): World {
    const ironMines = world.machines.filter(
        m => m.type === "iron-mine"
    );
    const coalMines = world.machines.filter(
      m => m.type === "coal-mine"
    )
    const waterPump = world.machines.filter(
      m => m.type === "water-pump"
    )
    return {
        ...world,
        resources: {
            iron: world.resources.iron + ironMines.length,
            coal: world.resources.coal + coalMines.length,
            water: world.resources.water + waterPump.length
        }
    }
}