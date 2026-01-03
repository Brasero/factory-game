import type {World} from "../models/World";
import {Grid} from "./Grid.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {MACHINE_CAPACITY} from "@engine/config/machineConfig.ts";

export function createWorld(): World {
    return {
        tick: 0,
        grid: new Grid(20, 15),
        machines: [],
        resources: {
            iron: 0,
            coal: 0,
            water: 0
        },
        resourceNodes: [
            { x: 2, y: 3, resource: "iron" },
            { x: 6, y: 5, resource: "coal" },
            { x: 10, y: 4, resource: "water" }
        ],
        conveyors: [],
        storages: [
            {x:4, y: 5, stored: {iron: 90} as Record<ResourcesType, number>, capacity: 100}
        ],
    }
}