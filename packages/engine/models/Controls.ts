import {MachineType} from "@engine/models/Machine";

export type SelectedItem = "storage" | "conveyor" | MachineType
export type ToolMode = "build" | "destroy";

export interface Controls {
  selectedItem: SelectedItem | "";
  currentTool: ToolMode;
}
