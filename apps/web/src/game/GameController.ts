import {createWorld} from "@engine/world/WorldFactory.ts";
import {setWorld} from "@web/store/gameSlice.ts";
import {GameEngine} from "@engine/core/GameEngine.ts";
import {TickLoop} from "@engine/core/TickLoop.ts";
import store from "@web/store/store.ts";
import {render} from "@web/render/CanvasRenderer.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import {MACHINE_CAPACITY} from "@engine/config/machineConfig.ts";

const world = createWorld();
const engine = new GameEngine(world);
const loop = new TickLoop();

export function startGame() {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");
    loop.start(() => {
        engine.tick();
        updateWorld();

        if (ctx) render(ctx, engine.getWorld());
    }, 100)
}

export function pauseGame() {
    loop.stop()
}

export function placeIronMine(x: number, y: number) {
    const success = engine.placeMachine(x, y, "iron-mine");
    
    if (success) {
        updateWorld()
    }
    
    return success;
}

export function placeCoalMine(x: number, y: number) {
    const success = engine.placeMachine(x, y, "coal-mine");
    
    if (success) {
        updateWorld()
    }
    
    return success;
}

export function placeWaterPump(x: number, y: number) {
    const success = engine.placeMachine(x, y, "water-pump");
    
    if (success) {
        updateWorld()
    }
    
    return success;
}

export function placeConveyor(x: number, y: number, direction: DirectionType) {
    const success = engine.placeConveyor(x, y, direction, MACHINE_CAPACITY["conveyor"])
    
    if (success) {
        updateWorld();
    }
    
    return success
}

function updateWorld(): void {
    const snapshot = structuredClone(engine.getWorld());
    store.dispatch(setWorld({...snapshot, grid: engine.getWorld().grid}))
}