import type {RootState} from "./store.types.ts";

// Selecteur pour obtenir la machine selectionnee
export const selectSelectedItem = (state: RootState) => state.control.selectedItem;

// Selecteur pour connaitre l'etat du jeu (pause / lecture)
export const selectGamePaused = (state: RootState) => state.control.paused;

export const selectCurentTool = (state: RootState) => state.control.currentTool;
