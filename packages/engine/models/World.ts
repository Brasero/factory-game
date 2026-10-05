import type {Machine} from "@engine/models/Machine";
import type {Resources} from "@engine/models/Resources";
import {Grid} from "@engine/world/Grid.ts";
import type {Conveyor} from "@engine/models/Conveyor.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {CampaignState} from "./Campaign";
import type {Tunnel} from "./Tunnel";
import type {Pipe} from "./Pipe";

export interface World {
    tick: number;
    grid?: Grid;
    machines: Machine[];
    resources: Resources;
    conveyors: Conveyor[];
    pipes: Pipe[];
    storages: Storage[];
    tunnels: Tunnel[];
    campaign: CampaignState;
}
