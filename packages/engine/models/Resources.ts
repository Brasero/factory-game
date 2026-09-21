export const RESOURCE_TYPES = ["iron", "coal", "water", "ironPlate", "steel", "copper", "copperWire", "circuit"] as const;

export type ResourcesType = typeof RESOURCE_TYPES[number];

export interface Resources {
    iron: number;
    coal: number;
    water: number;
    ironPlate: number;
    steel?: number;
    copper?: number;
    copperWire?: number;
    circuit?: number;
}

export const emptyResources = (): Required<Resources> => ({
    iron: 0,
    coal: 0,
    water: 0,
    ironPlate: 0,
    steel: 0,
    copper: 0,
    copperWire: 0,
    circuit: 0
});
