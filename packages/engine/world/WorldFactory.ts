import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import {config} from "@web/config/gridConfig.ts";
import {resourceNodes} from "@engine/world/resourceNode.ts";
import {MapGenerator} from "@engine/world/MapGenerator.ts";
import {levels} from "@engine/config/LevelConfig.ts";

export function createWorld(): World {
    const gridWidth = config.WIDTH / config.CELL_SIZE
    const gridHeight = config.HEIGHT / config.CELL_SIZE
    const tileMap = MapGenerator.generate({
        width: gridWidth,
        height: gridHeight,
        islands: levels[0].islands
    })
    const grid = new Grid(gridWidth, gridHeight, tileMap)
    for (const node of resourceNodes) {
        grid.setResource(node.x, node.y, node.resource);
    }
    return {
        tick: 0,
        grid,
        machines: [],
        resources: {
            iron: 0,
            coal: 0,
            water: 0
        },
        conveyors: [],
        storages: [],
    }
}