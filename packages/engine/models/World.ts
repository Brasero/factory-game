import {Machine} from "@engine/models/Machine";
import {Resources} from "@engine/models/Resources";
import {Grid} from "@engine/world/Grid.ts";
import type {Conveyor} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";

export interface World {
    tick: number;
    grid?: Grid;
    machines: Machine[];
    resources: Resources;
    conveyors: Conveyor[];
    storages: Storage[];
}