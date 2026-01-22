import {setWorld} from "@web/store/gameSlice.ts";
import {createSession, TickLoop} from "@engine/api/index.ts";
import store from "@web/store/store.ts";
import {render} from "@web/render/CanvasRenderer.ts";
import type {DirectionType, WorldSnapshot, SelectedItem} from "@engine/api/types.ts";

const session = createSession();
const loop = new TickLoop();

export function startGame() {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");
    
    loop.start(() => {
        session.tick();
        const snapshot = updateWorld();
        if (ctx) render(ctx, snapshot);
    }, 100)
}

export function pauseGame() {
    loop.stop()
}

export function placeIronMine(x: number, y: number) {
    const success = session.dispatch({
        type: "place-machine",
        x,
        y,
        machineType: "iron-mine"
    });
    if (success) {
        updateWorld()
    }
    return success;
}

export function placeCoalMine(x: number, y: number) {
    const success = session.dispatch({
        type: "place-machine",
        x,
        y,
        machineType: "coal-mine"
    });
    if (success) {
        updateWorld()
    }
    return success;
}

export function placeWaterPump(x: number, y: number) {
    const success = session.dispatch({
        type: "place-machine",
        x,
        y,
        machineType: "water-pump"
    });
    if (success) {
        updateWorld()
    }
    return success;
}

export function placeConveyor(x: number, y: number, direction: DirectionType) {
    const success = session.dispatch({
        type: "place-conveyor",
        x,
        y,
        direction
    })
    if (success) {
        updateWorld();
    }
    return success
}

export function placeConveyorLine(
  line: {x: number, y: number, direction: DirectionType}[]
) {
    for (const c of line) {
        const success = placeConveyor(c.x, c.y, c.direction)
        if (!success) break
    }
}

export function canPlaceAt(x: number, y: number, item: SelectedItem | ""): boolean {
    if (!item) return false;
    return session.canPlaceMachine(x, y, item);
}

export function placeStorage(x: number, y: number) {
    const success = session.dispatch({
        type: "place-storage",
        x,
        y
    });
    
    if (success) {
        updateWorld();
    }
    return success
}

export function destroyEntity(x: number, y: number) {
    session.dispatch({
        type: "destroy-entity",
        x,
        y
    })
    updateWorld();
}

function updateWorld(): WorldSnapshot {
    const snapshot = session.getSnapshot();
    store.dispatch(setWorld(snapshot))
    return snapshot;
}
