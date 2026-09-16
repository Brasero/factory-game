import {expect, it, vi} from "vitest";
import {connectedRouterIds, drawRouter} from "./conveyor";
import type {Conveyor, DirectionType} from "@engine/api/types";
import {assetManager} from "../manager/AssetManager";
vi.mock("../manager/AssetManager", () => ({assetManager: {getImage: vi.fn(() => ({}))}}));

it.each([
  ["splitter", "down", 0], ["splitter", "up", 2], ["splitter", "left", 4], ["splitter", "right", 6],
  ["merger", "down", 0], ["merger", "up", 2], ["merger", "right", 4], ["merger", "left", 6]
] as const)("uses native %s sprites facing %s", (type, direction, row) => {
  // No Canvas rotation: orientation must come from the source rectangle.
  const ctx = {drawImage: vi.fn()};
  for (const connected of [false, true]) {
    for (let tick = 0; tick < 32; tick++) {
      drawRouter(ctx as unknown as CanvasRenderingContext2D, 1, 2, direction, type, tick, connected);
      expect(ctx.drawImage.mock.lastCall).toEqual([
        expect.anything(), Math.floor(tick / 2) % (connected ? 8 : 4) * 64,
        (row + (connected ? 0 : 1)) * 64, 64, 64, 32, 64, 32, 32
      ]);
    }
  }
  expect(assetManager.getImage).toHaveBeenCalledWith(`router.${type}`);
});

const belt = (id: string, x: number, y: number, direction: DirectionType, type: Conveyor["type"] = "conveyor"): Conveyor => ({
  id, x, y, direction, type, entityType: "conveyor", carrying: [], capacity: 3, speed: 0.2
});
it("updates connection state after connection, rotation and removal", () => {
  const router = belt("router", 2, 2, "right", "splitter");
  expect(connectedRouterIds([router]).has(router.id)).toBe(false);
  const input = belt("input", 1, 2, "right");
  expect(connectedRouterIds([router, input]).has(router.id)).toBe(true);
  expect(connectedRouterIds([{...router, direction: "left"}, {...input, direction: "up"}]).has(router.id)).toBe(true); // Left is now an output.
  expect(connectedRouterIds([router, {...input, direction: "up"}]).has(router.id)).toBe(false);
  expect(connectedRouterIds([router]).has(router.id)).toBe(false);
});
