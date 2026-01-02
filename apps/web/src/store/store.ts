import {configureStore} from "@reduxjs/toolkit";
import gameSlice from "@web/store/gameSlice.js";
import controlSlice from "@web/store/controlSlice.ts";

const store = configureStore({
    reducer: {
        game: gameSlice,
        control: controlSlice
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([])
})


export default store;