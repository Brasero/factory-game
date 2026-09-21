import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from "@reduxjs/toolkit";
import type {SelectedItem, ToolMode, Controls} from "@engine/api/types.ts";
import type {MachineVariant} from "@engine/models/Machine";

const initialState: {paused: boolean; selectedVariant: MachineVariant} & Controls = {
	selectedItem: "",
	currentTool: "build",
	paused: false
	, selectedVariant: "standard"
}

const controlSlice = createSlice({
	name: "control",
	initialState,
	reducers: {
		setSelectedItem(state, action: PayloadAction<SelectedItem|"">) {
			state.selectedItem = action.payload
		},
		togglePause(state) {
			state.paused = !state.paused
		},
		setPaused(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
		},
		setSelectedVariant(state, action: PayloadAction<MachineVariant>) {
			state.selectedVariant = action.payload
		},
		setToolMode(state, action: PayloadAction<ToolMode>) {
			state.currentTool = action.payload
		}
	}
})

export const {
	setSelectedItem,
	togglePause,
	setPaused,
	setSelectedVariant,
	setToolMode
} = controlSlice.actions;

export default controlSlice.reducer;
