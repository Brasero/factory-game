export type MachineType = "iron-mine";

export interface Machine {
    id: string;
    type: MachineType;
    x: number;
    y: number;
}