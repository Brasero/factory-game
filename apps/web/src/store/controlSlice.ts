import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from "@reduxjs/toolkit";
import type {RootState} from "@web/store/store.types.ts";
import type {SelectedItem} from "@engine/models/Controls.ts";
import type {Controls} from "@engine/models/Controls.ts";

const initialState: {paused: boolean} & Controls = {
	selectedItem: "",
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
		}
	}
})

export const {
	setSelectedItem,
	togglePause
} = controlSlice.actions;

export default controlSlice.reducer;