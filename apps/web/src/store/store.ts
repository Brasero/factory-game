import {configureStore} from "@reduxjs/toolkit";
import gameSlice from "./gameSlice.js";

const store = configureStore({
    reducer: {
        game: gameSlice
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([])
})


export default store;