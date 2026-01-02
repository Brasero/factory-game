import {Machine} from "@engine/models/Machine";
import {Resources} from "@engine/models/Resources";
import {Grid} from "@engine/world/Grid.ts";
import type {ResourceNode} from "@engine/models/ResourceNode.ts";
import type {Conveyor} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";

export interface World {
    tick: number;
    grid?: Grid;
    machines: Machine[];
    resources: Resources;
    resourceNodes: ResourceNode[];
    conveyors: Conveyor[];
    storages: Storage[];
}