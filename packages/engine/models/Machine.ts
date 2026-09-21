import type {ResourcesType} from "@engine/models/Resources.ts";
import type {BaseEntity} from "@engine/models/BaseEntity.ts";
import type {RecipeId} from "@engine/config/recipeConfig";

export type MachineType = "iron-mine" | "coal-mine" | "copper-mine" | "water-pump" |
    "iron-smelter" | "steel-smelter" | "wire-mill" | "assembler" | "conveyor";
export type MachineVariant = "eco" | "standard" | "industrial";

export interface Machine extends BaseEntity {
    type: MachineType;
    entityType: "machine";
    progress: number;
    active: boolean;
    buffer: Partial<Record<ResourcesType, number>>;
    capacity: number;
    spriteName?: string;
    efficiency: number;
    production: number;
    variant?: MachineVariant;
    recipeId?: RecipeId;
    paused?: boolean;
}

export function isMachineType(entity: unknown): entity is Machine {
    return (
        typeof entity === 'object' &&
        entity !== null &&
        "entityType" in entity && entity.entityType === 'machine'
    )
}
