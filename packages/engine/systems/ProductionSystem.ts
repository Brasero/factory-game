import {World} from "../models/World";

export function runProduction(world: World) {
    const ironMines = world.machines.filter(
        m => m.type === "iron-mine"
    );
    world.resources.iron += ironMines.length;
}