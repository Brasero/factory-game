import type {RootState} from "./store.types.ts";

// Sélecteur pour obtenir l'état du jeu à partir de l'état racine
export const selectGameState = (state: RootState) => state.game;

// Sélecteur pour obtenir la quantité de fer dans l'inventaire
export const selectIronQuantity = (state: RootState) => state.game.resources.iron;

// Sélecteur pour obtenir la quantité de charbon dans l'inventaire
export const selectCoalQuantity = (state: RootState) => state.game.resources.coal;

// Sélecteur pour obtenir la quantité d'eau dans l'inventaire
export const selectWaterQuantity = (state: RootState) => state.game.resources.water;

// Sélecteur pour obtenir l'avancement du temps (tick)
export const selectGameTick = (state: RootState) => state.game.tick;

// Sélecteur pour obtenir la machine sélèctionnée
export const selectSelectedItem = (state: RootState) => state.control.selectedItem;

// Sélecteur pour connaitre l'état du jeu (pause / lecture)
export const selectGamePaused = (state: RootState) => state.control.paused;