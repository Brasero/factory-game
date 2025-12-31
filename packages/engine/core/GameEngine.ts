import {World} from "../models/World";
import {runProduction} from "../systems/ProductionSystem";

export class GameEngine {
    public world: World
    constructor(world: World) {
        this.world = world
    }

    tick() {
        runProduction(this.world);
        this.world.tick += 1;
    }

    getWorld() {
        return this.world;
    }
}