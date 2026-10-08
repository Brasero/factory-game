import {expect, it} from "vitest";
import {createTestWorld} from "@engine/test/createTestWorld";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {runConveyors} from "@engine/systems/ConveyorSystem";
import {buildConveyorMotion, conveyorVisualProgress} from "./conveyorMotion";
import {buildConveyorPath, interpolateOnConveyor} from "../CanvasRenderer";
import type {Conveyor} from "@engine/api/types";

const belt = (id: string, x: number, progress: number[]): Conveyor => ({
  id, x, y: 0, entityType: "conveyor", type: "conveyor", direction: "right", capacity: 3, speed: 0.2,
  carrying: progress.map(progress => ({type: "iron", amount: 1, progress}))
});

it("interpolates actual movement and keeps saturated queues stationary over successive ticks", () => {
  const world = createTestWorld();
  world.conveyors = [belt("blocked", 0, [1, 0.65, 0.3])];
  const before = buildWorldSnapshot(world);
  runConveyors(world); world.tick++;
  const after = buildWorldSnapshot(world);
  const motion = buildConveyorMotion(before, after);
  for (const alpha of [0, 0.5, 1]) {
    [1, 0.65, 0.3].forEach((progress, index) => {
      expect(conveyorVisualProgress(after.conveyors[0], index, alpha, motion)).toBeCloseTo(progress);
    });
  }
});

it("keeps a resource continuous across belt boundaries, while matching the remaining queue", () => {
  const world = createTestWorld();
  world.conveyors = [belt("source", 0, [1, 0.5]), belt("target", 1, [])];
  const before = buildWorldSnapshot(world);
  runConveyors(world); world.tick++;
  const after = buildWorldSnapshot(world);
  const motion = buildConveyorMotion(before, after);
  const sourceExit = interpolateOnConveyor(buildConveyorPath(before, before.conveyors[0], 32), 1);
  const targetEntry = interpolateOnConveyor(buildConveyorPath(after, after.conveyors[1], 32),
    conveyorVisualProgress(after.conveyors[1], 0, 0, motion));
  expect(targetEntry).toEqual(sourceExit);
  expect(conveyorVisualProgress(after.conveyors[0], 0, 0.5, motion)).toBeCloseTo(2 / 3);
  expect(conveyorVisualProgress(after.conveyors[1], 0, 0.5, motion)).toBeCloseTo(1 / 12);
  const arrivalEnd = conveyorVisualProgress(after.conveyors[1], 0, 1, motion);
  runConveyors(world); world.tick++;
  const next = buildWorldSnapshot(world);
  const nextMotion = buildConveyorMotion(after, next);
  expect(conveyorVisualProgress(next.conveyors[1], 0, 0, nextMotion)).toBeCloseTo(arrivalEnd);
  expect(conveyorVisualProgress(next.conveyors[1], 0, 0.5, nextMotion)).toBeGreaterThan(arrivalEnd);
});

it("moves through a corner, preserves motion during same-tick edits and resets after skipped ticks", () => {
  const world = createTestWorld();
  world.conveyors = [belt("source", 0, []), {...belt("turn", 1, [0.4]), direction: "down"}];
  const before = buildWorldSnapshot(world);
  runConveyors(world); world.tick++;
  const after = buildWorldSnapshot(world);
  const motion = buildConveyorMotion(before, after);
  const path = buildConveyorPath(after, after.conveyors[1], 32);
  const position = interpolateOnConveyor(path, conveyorVisualProgress(after.conveyors[1], 0, 0, motion));
  expect(position.x).toBeCloseTo(path.corner.x);
  expect(position.y).toBeCloseTo(path.corner.y);
  const edited = {...after, machines: []};
  const retained = buildConveyorMotion(after, edited, motion);
  expect(conveyorVisualProgress(edited.conveyors[1], 0, 0.5, retained)).toBeCloseTo(7 / 12);
  expect(conveyorVisualProgress(edited.conveyors[1], 0, 0, buildConveyorMotion(after, after))).toBeCloseTo(2 / 3);
  world.tick += 5;
  expect(buildConveyorMotion(after, buildWorldSnapshot(world)).size).toBe(0);
});
