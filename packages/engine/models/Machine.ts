import type {ResourcesType} from "@engine/models/Resources.ts";

export type MachineType = "iron-mine"|"coal-mine"|"water-pump"|"conveyor";

export interface Machine {
    id: string;
    type: MachineType;
    x: number;
    y: number;
    progress: number;
    buffer: Record<ResourcesType, number>;
    capacity: number;
}