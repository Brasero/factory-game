import {configureStore} from "@reduxjs/toolkit";
import controlSlice from "@web/store/controlSlice.ts";

const store = configureStore({
    reducer: {
        control: controlSlice
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: true
    }).concat([])
})


export default store;
