import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import {extractResourceNodeFromLevel} from "@engine/world/resourceNode.ts";
import {MapGenerator} from "@engine/world/MapGenerator.ts";
import {levels} from "@engine/config/LevelConfig.ts";
import {CAMPAIGN_LEVELS, CAMPAIGN_MAP, CAMPAIGN_POLLUTION_LIMIT} from "@engine/config/campaignConfig";
import {emptyResources} from "@engine/models/Resources";
import type {Tunnel} from "@engine/models/Tunnel";
import {INITIAL_CONSTRUCTION_MATERIALS} from "@engine/config/constructionConfig";

export function createWorld(legacyTerrain = false): World {
    const gridWidth = CAMPAIGN_MAP.width;
    const gridHeight = CAMPAIGN_MAP.height;
    const resourceNodes = levels.flatMap(extractResourceNodeFromLevel);
    const tileMap = MapGenerator.generate({
        width: gridWidth,
        height: gridHeight,
        legacy: legacyTerrain,
        islands: levels.flatMap((level, index) => level.islands.map(island => legacyTerrain ? {...island, shape: {type: "organique", size: index === 0 ? 18 : 19}} : island))
    })
    const grid = new Grid(gridWidth, gridHeight, tileMap)
    for (const node of resourceNodes) {
        grid.setResource(node.x, node.y, node.resource);
    }
    for (const level of CAMPAIGN_LEVELS) {
        for (let dy = -2; dy <= 2; dy++) for (let dx = -18; dx <= 18; dx++) grid.removeDecoration({x: level.center.x + dx, y: level.center.y + dy});
    }
    for (const node of resourceNodes) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) grid.removeDecoration({x: node.x + dx, y: node.y + dy});
    return {
        tick: 0,
        grid,
        machines: [],
        resources: emptyResources(),
        conveyors: [],
        pipes: [],
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
            contracts: {},
            constructionMaterials: INITIAL_CONSTRUCTION_MATERIALS,
            pollution: 0,
            pollutionLimit: CAMPAIGN_POLLUTION_LIMIT,
            status: "playing",
            levels: CAMPAIGN_LEVELS.map((level, index) => ({id: level.id, status: index === 0 ? "active" : "locked", pollution: 0, exports: {}, objectiveProgress: {value: 0, sustained: 0, baseline: {}, emissions: 0, attempts: 0}, challenges: Object.fromEntries((level.challenges ?? []).map(challenge => [challenge.id, {value: 0, sustained: 0, baseline: {}, emissions: 0, attempts: 0}]))})),
            statistics: {extracted: emptyResources(), produced: emptyResources(), exported: emptyResources()}
        }
    }
}
