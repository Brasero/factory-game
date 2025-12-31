import {createWorld} from "../../../../packages/engine/world/WorldFactory.ts";
import {setWorld} from "../store/gameSlice.ts";
import {GameEngine} from "../../../../packages/engine/core/GameEngine.ts";
import {TickLoop} from "../../../../packages/engine/core/TickLoop.ts";
import store from "../store/store.ts";
import {render} from "../render/CanvasRenderer.ts";
import type {World} from "../../../../packages/engine/models/World.ts";

const world = createWorld();
const engine = new GameEngine(world);
const loop = new TickLoop();

export function startGame() {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");

    loop.start(() => {
        engine.tick();
        const snapshot: World = structuredClone(engine.getWorld());
        store.dispatch(setWorld(snapshot));

        if (ctx) render(ctx, engine.getWorld());
    })
}

export function placeIronMine(x: number, y: number) {
    engine.getWorld().machines.push({
        id: crypto.randomUUID(),
        type: "iron-mine",
        x,
        y
    })
}