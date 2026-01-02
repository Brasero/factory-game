import {createWorld} from "@engine/world/WorldFactory.ts";
import {setWorld} from "@web/store/gameSlice.ts";
import {GameEngine} from "@engine/core/GameEngine.ts";
import {TickLoop} from "@engine/core/TickLoop.ts";
import store from "@web/store/store.ts";
import {render} from "@web/render/CanvasRenderer.ts";

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
    })
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

function updateWorld(): void {
    const snapshot = engine.getWorld();
    store.dispatch(setWorld(snapshot))
}