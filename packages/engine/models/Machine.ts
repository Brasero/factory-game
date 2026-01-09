import type {ResourcesType} from "@engine/models/Resources.ts";
import type {Position} from "@engine/models/Position.ts";
import {isPositionType} from "@engine/models/Position.ts";

export type MachineType = "iron-mine"|"coal-mine"|"water-pump"|"conveyor";

export interface Machine extends Position{
    id: string;
    type: MachineType;
    progress: number;
    active: boolean;
    buffer: Record<ResourcesType, number>;
    capacity: number;
    spriteName?: string;
}

export function isMachineType(entity: unknown): boolean {
    return (
        typeof entity === 'object' &&
        isPositionType(entity) &&
        "id" in entity &&
        "type" in entity &&
        "progress" in entity &&
        "active" in entity &&
        "buffer" in entity &&
        "capacity" in entity &&
        (
            Object.keys(entity).length === 6 ||
            ("spriteName" in entity && Object.keys(entity).length === 7)
        )
    )
}
