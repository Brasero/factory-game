import type {ConveyorPlacement, DirectionType, Pipe, Position, WorldSnapshot} from "@engine/api/types";
import {recipeInputs} from "@engine/config/recipeConfig";
import {assetManager} from "../manager/AssetManager";

const DELTA: Record<DirectionType, Position> = {
  up: {x: 0, y: -1}, down: {x: 0, y: 1}, left: {x: -1, y: 0}, right: {x: 1, y: 0}
};
const DIRECTIONS = Object.keys(DELTA) as DirectionType[];
const opposite = (direction: DirectionType): DirectionType =>
  ({up: "down", down: "up", left: "right", right: "left"})[direction] as DirectionType;

type PipeSprite = {sx: number; sy: number; rotation?: number};

/** Selects a real 16 px atlas part for every supported network shape. */
export function pipeSprite(connections: Set<DirectionType>, direction: DirectionType, wet: boolean): PipeSprite {
  const has = (...items: DirectionType[]) => items.every(item => connections.has(item));
  if (connections.size >= 3) return {sx: 64, sy: 16};
  if (connections.size === 2) {
    if (has("left", "right")) return {sx: 48, sy: wet ? 48 : 64};
    if (has("up", "down")) return {sx: 48, sy: wet ? 48 : 64, rotation: Math.PI / 2};
    if (has("right", "down")) return {sx: 0, sy: 0};
    if (has("left", "down")) return {sx: 32, sy: 0};
    if (has("right", "up")) return {sx: 0, sy: 32};
    return {sx: 32, sy: 32};
  }
  const only = [...connections][0] ?? direction;
  const rotation = only === "right" ? 0 : only === "down" ? Math.PI / 2 : only === "left" ? Math.PI : -Math.PI / 2;
  return {sx: 48, sy: 16, rotation};
}

function pipeConnections(world: WorldSnapshot, pipe: Pipe): Set<DirectionType> {
  const connections = new Set<DirectionType>();
  const pipes = world.pipes ?? [];
  for (const direction of DIRECTIONS) {
    const delta = DELTA[direction];
    const neighbour = pipes.find(other => other.x === pipe.x + delta.x && other.y === pipe.y + delta.y);
    if (neighbour && (pipe.direction === direction || neighbour.direction === opposite(direction))) connections.add(direction);
  }
  if (world.machines.some(machine => machine.type === "water-pump" && machine.x + 1 === pipe.x && machine.y === pipe.y)) {
    connections.add("left");
  }
  const output = DELTA[pipe.direction];
  const machine = world.machines.find(item => item.x === pipe.x + output.x && item.y === pipe.y + output.y);
  if (machine && recipeInputs(machine).some(([resource]) => resource === "water")) connections.add(pipe.direction);
  return connections;
}

export function drawPipeAt(ctx: CanvasRenderingContext2D, world: WorldSnapshot, pipe: Pipe, cellSize: number) {
  const image = assetManager.getImage("pipe.metal");
  const connections = pipeConnections(world, pipe);
  const sprite = pipeSprite(connections, pipe.direction, pipe.water > 0);
  const cx = pipe.x * cellSize + cellSize / 2;
  const cy = pipe.y * cellSize + cellSize / 2;
  const spriteSize = cellSize * 0.62;
  ctx.save();
  // Les prolongements se rejoignent au bord des cases ; la pièce centrale peut donc rester plus petite.
  ctx.strokeStyle = "#39465e";
  ctx.lineWidth = Math.max(8, spriteSize * 0.5);
  ctx.lineCap = "butt";
  ctx.beginPath();
  for (const direction of connections) {
    const delta = DELTA[direction];
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + delta.x * cellSize / 2, cy + delta.y * cellSize / 2);
  }
  ctx.stroke();
  ctx.strokeStyle = "#66758f";
  ctx.lineWidth = Math.max(5, spriteSize * 0.32);
  ctx.stroke();
  ctx.translate(cx, cy);
  if (sprite.rotation) ctx.rotate(sprite.rotation);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, sprite.sx, sprite.sy, 16, 16, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
  ctx.restore();
}

export function drawPreviewPipes(
  ctx: CanvasRenderingContext2D,
  placements: ConveyorPlacement[],
  world: WorldSnapshot,
  cellSize: number
) {
  const previewPipes: Pipe[] = placements.map((placement, index) => ({
    ...placement, id: `preview-pipe-${index}`, entityType: "pipe", water: 0, capacity: 10
  }));
  const previewWorld: WorldSnapshot = {...world, pipes: [...(world.pipes ?? []), ...previewPipes]};
  ctx.save();
  ctx.globalAlpha = 0.68;
  previewPipes.forEach(pipe => drawPipeAt(ctx, previewWorld, pipe, cellSize));
  ctx.restore();
}
