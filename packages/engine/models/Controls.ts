import type {MachineType} from "@engine/models/Machine";

export type SelectedItem = "splitter" | "merger" | "miner" | "storage" | "conveyor" | "pipe" | MachineType
export type ToolMode = "build" | "destroy";

export interface Controls {
  selectedItem: SelectedItem | "";
  currentTool: ToolMode;
}
