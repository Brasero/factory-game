import type {ResourcesType} from "@engine/models/Resources.ts";
import type {Position} from "@engine/models/Position.ts";
import {isPositionType} from "@engine/models/Position.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";

export type MachineType = "iron-mine"|"coal-mine"|"water-pump"|"conveyor";

export interface Machine extends BaseEntity {
    type: MachineType;
    entityType: "machine";
    progress: number;
    active: boolean;
    buffer: Record<ResourcesType, number>;
    capacity: number;
    spriteName?: string;
}

export function isMachineType(entity: unknown): entity is Machine {
    return (
        typeof entity === 'object' &&
        entity !== null &&
        (entity as any).entityType === 'machine'
    )
}
