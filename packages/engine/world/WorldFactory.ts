import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import {config} from "@web/config/gridConfig.ts";
import {resourceNodes} from "@engine/world/resourceNode.ts";
import {MapGenerator} from "@engine/world/MapGenerator.ts";

export function createWorld(): World {
    const gridWidth = config.WIDTH / config.CELL_SIZE
    const gridHeight = config.HEIGHT / config.CELL_SIZE
    const tileMap = MapGenerator.generate({width: gridWidth, height: gridHeight})
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
        tileMap: tileMap
    }
}