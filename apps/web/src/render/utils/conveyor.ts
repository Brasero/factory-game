import {acceptsInput, nextPosition, outputDirections, positionKey} from "@engine/systems/NetworkTopology";
import type {DirectionType, Conveyor, WorldSnapshot} from "@engine/api/types.ts";
import type {ConveyorTier} from "@engine/models/Conveyor.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import {config as conveyorConfig} from "@web/config/conveyorConfig.ts";
import {findPreviousConveyor} from "@web/render/CanvasRenderer.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";

const CELL_SIZE = gridConfig.CELL_SIZE;
type BeltSegment = "start" | "middle" | "end";
export function drawPreviewConveyor(ctx: CanvasRenderingContext2D, conveyors: {x: number, y: number, direction: DirectionType; type?: Conveyor["type"]; tier?: ConveyorTier}[], world?: WorldSnapshot) {
  conveyors.forEach((c) => {
    const px = c.x * CELL_SIZE;
    const py = c.y * CELL_SIZE;
    ctx.globalAlpha = 0.5;
    if (c.type === "splitter" || c.type === "merger") {
      const preview: Conveyor = {...c, type: c.type, id: "preview", entityType: "conveyor", carrying: [], speed: 0, capacity: 3};
      const neighbors = world?.conveyors.filter(belt => belt.x !== c.x || belt.y !== c.y) ?? [];
      drawRouter(ctx, c.x, c.y, c.direction, c.type, 0, connectedRouterIds([...neighbors, preview]).has(preview.id));
    }
    else drawBeltSprite(ctx, px, py, c.direction, c.direction, 0, c.tier, "middle")
    ctx.globalAlpha = 1;
    if (c.type === "splitter" || c.type === "merger") drawRouterArrows(ctx, c.x, c.y, c.direction, c.type);
  })
}

export function drawConveyors(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  return world.conveyors.forEach(c => drawConveyorAt(ctx, world, c));
}

export function drawConveyorAt(
  ctx: CanvasRenderingContext2D,
  world: WorldSnapshot,
  conveyor: Conveyor,
  previous?: Conveyor | null,
  connected?: boolean,
  tickInterpolation = 0,
  hasNext = false,
  incomingOverride?: DirectionType
) {
  if (conveyor.type !== "conveyor") return drawRouter(ctx, conveyor.x, conveyor.y, conveyor.direction, conveyor.type, world.tick, connected ?? connectedRouterIds(world.conveyors).has(conveyor.id));
  const px = conveyor.x * CELL_SIZE;
  const py = conveyor.y * CELL_SIZE;

  const previousConveyor = previous === undefined ? findPreviousConveyor(world, conveyor) : previous;
  const outgoing = conveyor.direction
  const incoming = incomingOverride ?? (previousConveyor ? getIncomingDirection(previousConveyor, conveyor) : outgoing);
  const frame = getBeltFrame(world.tick + tickInterpolation);
  const segment: BeltSegment = !previousConveyor ? "start" : hasNext ? "middle" : "end";
  drawBeltSprite(ctx, px, py, incoming, outgoing, frame, conveyor.tier, segment);
}



// HELPERS
export function getIncomingDirection(
    prev: Conveyor,
    curr: Conveyor
): DirectionType {
  if (prev.x < curr.x) return "right";
  if (prev.x > curr.x) return "left";
  if (prev.y < curr.y) return "down";
  return "up";
}

function getBeltFrame(tick: number) {
  return Math.floor(tick * conveyorConfig.ANIMATION_FRAMES_PER_TICK) % conveyorConfig.ANIMATION_FRAMES;
}

type BeltSource = {x: number; y: number; width: number; height: number};
const CLOCKWISE_NEXT: Record<DirectionType, DirectionType> = {right: "down", down: "left", left: "up", up: "right"};
const CORNER_QUADRANT: Record<string, {x: number; y: number}> = {
  "right-down": {x: 16, y: 0},
  "right-up": {x: 16, y: 16},
  "left-down": {x: 0, y: 0},
  "left-up": {x: 0, y: 16},
  "down-left": {x: 16, y: 16},
  "down-right": {x: 0, y: 16},
  "up-left": {x: 16, y: 0},
  "up-right": {x: 0, y: 0}
};

export function conveyorAssetKey(tier: ConveyorTier = 1) {
  return `conveyor.tier${tier}`;
}

function drawBeltSprite(ctx: CanvasRenderingContext2D, px: number, py: number,
  incoming: DirectionType, outgoing: DirectionType, frame: number, tier: ConveyorTier = 1,
  segment: BeltSegment = "middle") {
  const spriteSheet = assetManager.getImage(conveyorAssetKey(tier));
  const sourceX = frame * conveyorConfig.FRAME_COLUMNS * conveyorConfig.FRAME_SIZE;
  const displaySize = conveyorConfig.DISPLAY_SIZE;
  if (incoming === outgoing) {
    const source = straightBeltSource(outgoing, segment);
    ctx.drawImage(spriteSheet,
      sourceX + source.x, source.y, source.width, source.height,
      px - (displaySize - CELL_SIZE) / 2, py - (displaySize - CELL_SIZE) / 2, displaySize, displaySize);
    return;
  }

  // Les deux blocs de 32 px contiennent chacun les quatre orientations d'un virage.
  const clockwise = CLOCKWISE_NEXT[incoming] === outgoing;
  const cornerBlockX = clockwise ? 0 : 32;
  const quadrant = CORNER_QUADRANT[`${incoming}-${outgoing}`];
  ctx.drawImage(spriteSheet,
    sourceX + cornerBlockX + quadrant.x, quadrant.y, 16, 16,
    px - (displaySize - CELL_SIZE) / 2, py - (displaySize - CELL_SIZE) / 2, displaySize, displaySize);
}

function straightBeltSource(direction: DirectionType, segment: BeltSegment): BeltSource {
  const position = segment === "middle" ? 16 : segment === "start" ? 0 : 32;
  if (direction === "right") return {x: position, y: 48, width: 16, height: 16};
  if (direction === "left") return {x: 32 - position, y: 32, width: 16, height: 16};
  if (direction === "down") return {x: 80, y: position, width: 16, height: 16};
  return {x: 64, y: 32 - position, width: 16, height: 16};
}

export function connectedRouterIds(conveyors: Conveyor[]): Set<string> {
  const byPosition = new Map(conveyors.map(c => [positionKey(c), c]));
  const connected = new Set<string>();
  for (const source of conveyors) {
    for (const direction of outputDirections(source)) {
      const target = byPosition.get(positionKey(nextPosition(source, direction)));
      if (!target || !acceptsInput(target, source)) continue;
      connected.add(source.id);
      connected.add(target.id);
    }
  }
  return connected;
}

export function drawRouter(ctx: CanvasRenderingContext2D, x: number, y: number,
  direction: DirectionType, type: "splitter" | "merger", tick = 0, connected = false) {
  // Chaque orientation a une ligne jaune (8 frames), puis rouge (4 frames).
  const rows = type === "splitter"
    ? {down: 0, up: 2, left: 4, right: 6}
    : {down: 0, up: 2, right: 4, left: 6};
  const row = rows[direction] + (connected ? 0 : 1);
  const frame = Math.floor(tick / 2) % (connected ? 8 : 4);
  ctx.drawImage(assetManager.getImage(`router.${type}`), frame * 64, row * 64, 64, 64,
    x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

/** Placement only: input arrows point inward, output arrows point outward. */
export function drawRouterArrows(ctx: CanvasRenderingContext2D, x: number, y: number,
  direction: DirectionType, type: "splitter" | "merger") {
  const vectors = {up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0]} as const;
  const [forwardX, forwardY] = vectors[direction];
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0e111b";
  for (const [dx, dy] of Object.values(vectors)) {
    const isForward = dx === forwardX && dy === forwardY;
    const isRear = dx === -forwardX && dy === -forwardY;
    const input = type === "splitter" ? isRear : !isForward;
    const sign = input ? -1 : 1;
    ctx.save();
    ctx.translate((x + 0.5) * CELL_SIZE + dx * (CELL_SIZE / 2 + 9),
      (y + 0.5) * CELL_SIZE + dy * (CELL_SIZE / 2 + 9));
    ctx.rotate(Math.atan2(dy * sign, dx * sign));
    ctx.fillStyle = input ? "#65dfff" : "#ffd166";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(0, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(-7, -3);
    ctx.lineTo(-7, 3);
    ctx.lineTo(0, 3);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
