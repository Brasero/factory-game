import {createSession, TickLoop} from "@engine/api/index.ts";
import type {DirectionType, WorldSnapshot, SelectedItem} from "@engine/api/types.ts";
import {setWorldSnapshot} from "@web/game/worldStore.ts";

const session = createSession();
const loop = new TickLoop();
setWorldSnapshot(session.getSnapshot());

export function startGame() {
    loop.start(() => {
        session.tick();
        updateWorld();
    }, 100)
}

export function pauseGame() {
    loop.stop()
}

export function placeMiner(x: number, y: number) {
    if (session.canPlaceMachine(x, y, "iron-mine")) return placeIronMine(x, y);
    if (session.canPlaceMachine(x, y, "coal-mine")) return placeCoalMine(x, y);
    return false;
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

export function placeIronSmelter(x: number, y: number) {
    const success = session.dispatch({
        type: "place-machine",
        x,
        y,
        machineType: "iron-smelter"
    });
    if (success) {
        updateWorld()
    }
    return success;
}

export function placeConveyor(x: number, y: number, direction: DirectionType, conveyorType: "conveyor" | "splitter" | "merger" = "conveyor") {
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

export function placeConveyorLine(
  line: {x: number, y: number, direction: DirectionType}[]
) {
    for (const c of line) {
        const success = session.dispatch({type: "place-conveyor", ...c})
        if (!success) break
    }
    updateWorld();
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
    setWorldSnapshot(snapshot);
    return snapshot;
}
