import type {World} from "../models/World";

export function createWorld(): World {
    return {
        tick: 0,
        machines: [],
        resources: {
            iron: 0
        }
    }
}