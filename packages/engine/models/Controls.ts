import {MachineType} from "@engine/models/Machine";

export type SelectedItem = {} & MachineType

export interface Controls {
  selectedItem: SelectedItem | "";
}