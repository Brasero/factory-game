import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from "@reduxjs/toolkit";
import type {SelectedItem, ToolMode} from "@engine/models/Controls.ts";
import type {Controls} from "@engine/models/Controls.ts";

const initialState: {paused: boolean} & Controls = {
	selectedItem: "",
	currentTool: "build",
	paused: false
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
		setToolMode(state, action: PayloadAction<ToolMode>) {
			state.currentTool = action.payload
		}
	}
})

export const {
	setSelectedItem,
	togglePause,
	setToolMode
} = controlSlice.actions;

export default controlSlice.reducer;