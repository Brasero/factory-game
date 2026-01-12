import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {World} from "@engine/models/World.ts";
import type {MachineType} from "@engine/models/Machine.ts";

const initialState: Partial<World> = {
    tick: 0,
    machines: [],
    resources: {
        iron: 0,
        water: 0,
        coal: 0
    },
    resourceNodes: [],
    conveyors: [],
    storages: [],
}

const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        setWorld(_, action: PayloadAction<World>) {
            return action.payload;
        },
        addMachine(state, action: PayloadAction<MachineType>) {
            state.machines.push(action.payload);
        }
    }
})

export const {setWorld, addMachine} = gameSlice.actions;
export default gameSlice.reducer;