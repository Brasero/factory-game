import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from "@reduxjs/toolkit";
import type {SelectedItem, ToolMode, Controls} from "@engine/api/types.ts";

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
		setPaused(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
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
	setToolMode
} = controlSlice.actions;

export default controlSlice.reducer;
