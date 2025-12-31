import {Machine} from "./Machine";
import {Resources} from "./Resources";

export interface World {
    tick: number;
    machines: Machine[];
    resources: Resources;
}