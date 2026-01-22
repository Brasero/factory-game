import {createWorld} from "@engine/world/WorldFactory.ts";
import {setWorld} from "@web/store/gameSlice.ts";
import {GameEngine} from "@engine/core/GameEngine.ts";
import {TickLoop} from "@engine/core/TickLoop.ts";
import store from "@web/store/store.ts";
import {render} from "@web/render/CanvasRenderer.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";

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
    const success = engine.placeConveyor(x, y, direction)
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

export function placeStorage(x: number, y: number) {
    const success = engine.placeStorage(x, y);
    
    if (success) {
        updateWorld();
    }
    return success
}

export function destroyEntity(x: number, y: number) {
    engine.destroyEntityAt(x, y)
    updateWorld();
}

function updateWorld(): void {
    const world = engine.getWorld()
    const snapshot = structuredClone(world);
    store.dispatch(setWorld({...snapshot, grid: world.grid, conveyors: world.conveyors}))
}