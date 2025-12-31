import type {World} from "../../../../packages/engine/models/World.ts";

export function render(
    ctx: CanvasRenderingContext2D,
    world: World
) {
    ctx.clearRect(0, 0, 800, 600);
    world.machines.forEach(m => {
        ctx.fillStyle = "#777";
        ctx.fillRect(m.x * 40, m.y * 40, 36, 36)
    })
}