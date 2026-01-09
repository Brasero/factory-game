import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {config} from "@web/config/gridConfig.ts";
import {resourceNodes} from "@engine/world/resourceNode.ts";

export function createWorld(): World {
    const gridWidth = config.WIDTH / config.CELL_SIZE
    const gridHeight = config.HEIGHT / config.CELL_SIZE
    return {
        tick: 0,
        grid: new Grid(gridWidth, gridHeight),
        machines: [],
        resources: {
            iron: 0,
            coal: 0,
            water: 0
        },
        resourceNodes: resourceNodes,
        conveyors: [],
        storages: [],
    }
}