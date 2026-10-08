import {createSession, isGameSave, TickLoop} from "@engine/api/index.ts";
import type {GameSave} from "@engine/api/index.ts";
import type {DirectionType, WorldSnapshot, SelectedItem, Conveyor, SmartSplitterFilter, SmartSplitterPort} from "@engine/api/types.ts";
import type {MachineType, MachineVariant} from "@engine/models/Machine";
import {setWorldSnapshot} from "@web/game/worldStore.ts";
import type {RecipeId} from "@engine/config/recipeConfig";

const SAVE_KEY = "factstories.campaign.v1";
const readSave = (): GameSave | undefined => {
    if (typeof localStorage === "undefined") return undefined;
    try {
        const value: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
        return isGameSave(value) ? value : undefined;
    } catch { return undefined; }
};
let storedSave = readSave();
let session = createSession(storedSave);
const loop = new TickLoop();
setWorldSnapshot(session.getSnapshot());

export function startGame() {
    loop.start(() => {
        session.tick();
        const snapshot = updateWorld(false);
        if (snapshot.tick % 20 === 0) persistGame();
    }, 100)
}

export function pauseGame() {
    loop.stop()
    persistGame();
}

export function hasSavedGame() { return storedSave !== undefined; }
export function getCurrentSnapshot(): WorldSnapshot { return session.getSnapshot(); }

export function startNewCampaign() {
    loop.stop();
    session = createSession();
    storedSave = undefined;
    if (typeof localStorage !== "undefined") localStorage.removeItem(SAVE_KEY);
    return updateWorld(false);
}

export function placeMiner(x: number, y: number, variant: MachineVariant = "standard") {
    if (session.canPlaceMachine(x, y, "iron-mine", variant)) return placeMachine(x, y, "iron-mine", variant);
    if (session.canPlaceMachine(x, y, "coal-mine", variant)) return placeMachine(x, y, "coal-mine", variant);
    if (session.canPlaceMachine(x, y, "copper-mine", variant)) return placeMachine(x, y, "copper-mine", variant);
    if (session.canPlaceMachine(x, y, "uranium-mine", variant)) return placeMachine(x, y, "uranium-mine", variant);
    return false;
}

export function placeMachine(x: number, y: number, machineType: MachineType, variant: MachineVariant = "standard") {
    const success = session.dispatch({type: "place-machine", x, y, machineType, variant});
    if (success) updateWorld();
    return success;
}

export function placeIronMine(x: number, y: number) {
    return placeMachine(x, y, "iron-mine");
}

export function placeCoalMine(x: number, y: number) {
    return placeMachine(x, y, "coal-mine");
}

export function placeWaterPump(x: number, y: number) {
    return placeMachine(x, y, "water-pump");
}

export function placeIronSmelter(x: number, y: number) {
    return placeMachine(x, y, "iron-smelter");
}

export function placeConveyor(x: number, y: number, direction: DirectionType, conveyorType: Conveyor["type"] = "conveyor") {
    const success = session.dispatch({
        type: "place-conveyor",
        x,
        y,
        direction,
        conveyorType
    })
    if (success) {
        updateWorld();
    }
    return success
}

export function setSmartSplitterFilter(splitterId: string, port: SmartSplitterPort, filter: SmartSplitterFilter) {
    const success = session.dispatch({type: "set-smart-splitter-filter", splitterId, port, filter});
    if (success) updateWorld();
    return success;
}

export function placeConveyorLine(
  line: {x: number, y: number, direction: DirectionType}[]
) {
    for (const c of line) {
        const success = session.dispatch({type: "place-conveyor", ...c})
        if (!success) break
    }
    updateWorld();
}

export function placePipe(x: number, y: number, direction: DirectionType) {
    const success = session.dispatch({type: "place-pipe", x, y, direction});
    if (success) updateWorld();
    return success;
}

export function placePipeLine(line: {x: number; y: number; direction: DirectionType}[]) {
    for (const pipe of line) if (!session.dispatch({type: "place-pipe", ...pipe})) break;
    updateWorld();
}

export function canPlaceAt(x: number, y: number, item: SelectedItem | "", variant?: MachineVariant): boolean {
    if (!item) return false;
    return session.canPlaceMachine(x, y, item, variant);
}

export function activateLevel(levelId: string) {
    const success = session.dispatch({type: "activate-level", levelId});
    if (success) updateWorld();
    return success;
}

export function finalizeLevel(levelId: string) {
    const success = session.dispatch({type: "finalize-level", levelId});
    if (success) updateWorld();
    return success;
}

export function continueCampaign() {
    const success = session.dispatch({type: "continue-campaign"});
    if (success) updateWorld();
    return success;
}

export function selectMachineRecipe(machineId: string, recipeId: RecipeId) {
    const success = session.dispatch({type: "select-machine-recipe", machineId, recipeId});
    if (success) updateWorld();
    return success;
}

export function setMachinePaused(machineId: string, paused: boolean) {
    const success = session.dispatch({type: "set-machine-paused", machineId, paused});
    if (success) updateWorld();
    return success;
}

export function placeStorage(x: number, y: number, kind?: "shipping-depot") {
    const success = session.dispatch({
        type: "place-storage",
        kind,
        x,
        y
    });
    
    if (success) {
        updateWorld();
    }
    return success
}

export function acceptContract(contractId: string) {
    const success = session.dispatch({type: "accept-contract", contractId});
    if (success) updateWorld();
    return success;
}
export function cancelContract(contractId: string) {
    const success = session.dispatch({type: "cancel-contract", contractId});
    if (success) updateWorld();
    return success;
}
export function assignContract(depotId: string, contractId?: string) {
    const success = session.dispatch({type: "assign-contract", depotId, contractId});
    if (success) updateWorld();
    return success;
}

export function destroyEntity(x: number, y: number) {
    const success = session.dispatch({
        type: "destroy-entity",
        x,
        y
    })
    updateWorld();
    return success;
}

export function destroyEntities(positions: {x: number; y: number}[]) {
    if (!positions.length) return false;
    const success = session.dispatch({type: "destroy-entities", positions});
    if (success) updateWorld();
    return success;
}

function persistGame() {
    storedSave = session.createSave();
    try {
        if (typeof localStorage !== "undefined") localStorage.setItem(SAVE_KEY, JSON.stringify(storedSave));
    } catch {
        // La campagne reste jouable si le stockage du navigateur est indisponible.
    }
}

function updateWorld(save = true): WorldSnapshot {
    const snapshot = session.getSnapshot();
    setWorldSnapshot(snapshot);
    if (save) persistGame();
    return snapshot;
}
