import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {World} from "../../../../packages/engine/models/World.ts";

const initialState: World = {
    tick: 0,
    machines: [],
    resources: {
        iron: 0
    }
}

const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        setWorld(_, action: PayloadAction<World>) {
            return action.payload;
        },
        addMachine(state, action: PayloadAction<any>) {
            state.machines.push(action.payload);
        }
    }
})

export const {setWorld, addMachine} = gameSlice.actions;
export default gameSlice.reducer;