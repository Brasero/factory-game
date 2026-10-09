import {describe, expect, it} from "vitest";
import {canvasPoint, centerCamera, worldPoint, zoomCamera} from "./camera";
const camera = () => ({x: -100, y: -200, scale: 1, minScale: .5, maxScale: 2.5});

describe("Camera coordinates", () => {
  it("maps CSS-scaled, offset canvas coordinates to the same world cell at every zoom", () => {
    for (const scale of [.5, 1, 1.1, 2.5]) {
      const c = {...camera(), scale};
      const point = canvasPoint(50 + (c.x + 10.5 * 32 * scale) / 2, 90 + (c.y + 8.5 * 32 * scale) / 2,
        {left: 50, top: 90, width: 400, height: 300}, 800, 600);
      expect(worldPoint(point, c, 32)).toEqual({x: 10.5, y: 8.5});
    }
  });
  it("keeps the point beneath the pointer fixed through repeated zooms and limits", () => {
    const c = camera(), pointer = {x: 240, y: 120}, before = worldPoint(pointer, c, 32);
    for (const delta of [...Array<number>(25).fill(-1), ...Array<number>(40).fill(1)]) {
      zoomCamera(c, pointer, delta);
      expect(worldPoint(pointer, c, 32).x).toBeCloseTo(before.x);
      expect(worldPoint(pointer, c, 32).y).toBeCloseTo(before.y);
      expect(c.scale).toBeGreaterThanOrEqual(.5); expect(c.scale).toBeLessThanOrEqual(2.5);
    }
  });
  it("centers any island independently of the retained zoom", () => {
    const c = {...camera(), scale: 2.5};
    centerCamera(c, {x: 120, y: 135}, 1280, 720, 32);
    expect(worldPoint({x: 640, y: 360}, c, 32)).toEqual({x: 120, y: 135});
  });
});
