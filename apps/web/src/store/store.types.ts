import store from "./store.ts";

//Type de l'état racine de l'application
export type RootState = ReturnType<typeof store.getState>;

//Type du dispatch de l'application
export type AppDispatch = typeof store.dispatch;