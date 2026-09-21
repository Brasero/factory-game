import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import {extractResourceNodeFromLevel} from "@engine/world/resourceNode.ts";
import {MapGenerator} from "@engine/world/MapGenerator.ts";
import {levels} from "@engine/config/LevelConfig.ts";
import {CAMPAIGN_LEVELS, CAMPAIGN_MAP, CAMPAIGN_POLLUTION_LIMIT} from "@engine/config/campaignConfig";
import {emptyResources} from "@engine/models/Resources";
import type {Tunnel} from "@engine/models/Tunnel";

export function createWorld(): World {
    const gridWidth = CAMPAIGN_MAP.width;
    const gridHeight = CAMPAIGN_MAP.height;
    const resourceNodes = levels.flatMap(extractResourceNodeFromLevel);
    const tileMap = MapGenerator.generate({
        width: gridWidth,
        height: gridHeight,
        islands: levels.flatMap(level => level.islands)
    })
    const grid = new Grid(gridWidth, gridHeight, tileMap)
    for (const node of resourceNodes) {
        grid.setResource(node.x, node.y, node.resource);
    }
    return {
        tick: 0,
        grid,
        machines: [],
        resources: emptyResources(),
        conveyors: [],
        storages: [],
        tunnels: CAMPAIGN_LEVELS.flatMap(level => level.tunnels.map(definition => ({
            id: definition.id,
            x: definition.position.x,
            y: definition.position.y,
            entityType: "tunnel",
            type: definition.type,
            levelId: definition.levelId,
            linkedTunnelId: definition.linkedTunnelId,
            direction: "right",
            capacity: 200,
            stored: emptyResources()
        } satisfies Tunnel))),
        campaign: {
            activeLevelId: "level-1",
            pollution: 0,
            pollutionLimit: CAMPAIGN_POLLUTION_LIMIT,
            status: "playing",
            levels: CAMPAIGN_LEVELS.map((level, index) => ({id: level.id, status: index === 0 ? "active" : "locked", pollution: 0})),
            statistics: {extracted: emptyResources(), produced: emptyResources(), exported: emptyResources()}
        }
    }
}
