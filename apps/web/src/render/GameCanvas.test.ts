// @vitest-environment happy-dom
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import store from "@web/store/store";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice";
import {setWorldSnapshot} from "@web/game/worldStore";
import {GameCanvas} from "./GameCanvas";
import {render} from "./CanvasRenderer";
import {drawPreviewPipes} from "./utils/pipe";
import * as controller from "@web/game/GameController";
import {emptyResources} from "@engine/models/Resources";
import {createTestCampaign} from "@engine/test/createTestWorld";

vi.mock("./CanvasRenderer", () => ({render: vi.fn()}));
vi.mock("./utils/conveyor", () => ({drawPreviewConveyor: vi.fn()}));
vi.mock("./utils/pipe", () => ({drawPreviewPipes: vi.fn()}));
vi.mock("@web/game/GameController", () => ({
  canPlaceAt: vi.fn(() => true), destroyEntity: vi.fn(), destroyEntities: vi.fn(() => false), placeStorage: vi.fn(),
  placeConveyor: vi.fn(), placeMiner: vi.fn(), placeCoalMine: vi.fn(), placeIronMine: vi.fn(), placeIronSmelter: vi.fn(),
  placeWaterPump: vi.fn(), placeMachine: vi.fn(), placeConveyorLine: vi.fn(), placePipeLine: vi.fn(), setSmartSplitterFilter: vi.fn()
}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let root: Root;
let host: HTMLDivElement;
let canvas: HTMLCanvasElement;
let canvasContext: CanvasRenderingContext2D;
const world = (tick = 0) => ({tick, machines: [], conveyors: [], pipes: [], storages: [], tunnels: [], resources: emptyResources(), campaign: createTestCampaign()});
const tree = (width = 640, height = 480) => createElement(Provider, {store, children: createElement(GameCanvas, {width, height, cellSize: 32})});
const mouse = (target: EventTarget, type: string, x: number, y: number, buttons = 0, button = 0) => {
  act(() => { target.dispatchEvent(new MouseEvent(type, {bubbles: true, clientX: x, clientY: y, button, buttons})); });
};
const frame = () => act(() => { vi.advanceTimersByTime(20); });

beforeEach(() => {
  vi.useFakeTimers();
  canvasContext = {save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(), setLineDash: vi.fn()} as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
  store.dispatch(setToolMode("build")); store.dispatch(setSelectedItem(""));
  setWorldSnapshot(world());
  host = document.createElement("div"); document.body.append(host);
  root = createRoot(host);
  act(() => root.render(tree()));
  canvas = host.querySelector("canvas")!;
  frame();
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

describe("Canvas interactions (DOM)", () => {
  it("places and destroys at the selected cell without a simulation tick", () => {
    act(() => store.dispatch(setSelectedItem("storage")));
    mouse(canvas, "click", 80, 112);
    expect(controller.placeStorage).toHaveBeenCalledWith(2, 3);
    act(() => store.dispatch(setToolMode("destroy")));
    mouse(canvas, "click", 80, 112);
    expect(controller.destroyEntity).toHaveBeenCalledWith(2, 3);
  });
  it("places the recycler with the selected variant", () => {
    act(() => store.dispatch(setSelectedItem("recycler")));
    mouse(canvas, "click", 80, 112);
    expect(controller.placeMachine).toHaveBeenCalledWith(2, 3, "recycler", "standard");
  });
  it("places a single belt and previews movement within the starting cell", () => {
    act(() => store.dispatch(setSelectedItem("conveyor")));
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "mousemove", 17, 16, 1);
    mouse(canvas, "mouseup", 17, 16);
    expect(controller.placeConveyorLine).toHaveBeenCalledWith([{x: 0, y: 0, direction: "right"}]);
  });
  it("previews and places a dragged pipe line", () => {
    act(() => store.dispatch(setSelectedItem("pipe")));
    mouse(canvas, "mousemove", 16, 16);
    frame();
    expect(drawPreviewPipes).toHaveBeenCalled();
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "mousemove", 80, 16, 1);
    frame();
    expect(drawPreviewPipes).toHaveBeenLastCalledWith(expect.anything(), [
      {x: 0, y: 0, direction: "right"}, {x: 1, y: 0, direction: "right"}, {x: 2, y: 0, direction: "right"}
    ], expect.anything(), 32);
    mouse(canvas, "mouseup", 80, 16);
    expect(controller.placePipeLine).toHaveBeenCalledWith([
      {x: 0, y: 0, direction: "right"}, {x: 1, y: 0, direction: "right"}, {x: 2, y: 0, direction: "right"}
    ]);
  });
  it.each([
    ["conveyor", controller.placeConveyorLine],
    ["pipe", controller.placePipeLine]
  ] as const)("inverts the bend of a dragged %s line with R", (item, placeLine) => {
    act(() => store.dispatch(setSelectedItem(item)));
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "mousemove", 80, 80, 1);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "r"})));
    mouse(canvas, "mouseup", 80, 80);

    expect(placeLine).toHaveBeenLastCalledWith([
      {x: 0, y: 0, direction: "down"},
      {x: 0, y: 1, direction: "down"},
      {x: 0, y: 2, direction: "right"},
      {x: 1, y: 2, direction: "right"},
      {x: 2, y: 2, direction: "right"}
    ]);
  });
  it("destroys the rectangle between drag endpoints, previews it, and keeps the camera locked", () => {
    act(() => store.dispatch(setToolMode("destroy")));
    frame();
    const cameraBefore = vi.mocked(render).mock.lastCall?.[2];
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "mousemove", 80, 80, 1);
    frame();
    expect(canvasContext.fillRect).toHaveBeenLastCalledWith(0, 0, 96, 96);
    mouse(canvas, "mouseup", 80, 80);
    expect(controller.destroyEntities).toHaveBeenLastCalledWith([
      {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0},
      {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1},
      {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}
    ]);
    mouse(canvas, "mousedown", 100, 100, 1);
    mouse(canvas, "mousemove", 164, 132, 1);
    mouse(canvas, "mouseup", 164, 132);
    frame();
    expect(vi.mocked(render).mock.lastCall?.[2]).toMatchObject(cameraBefore!);
    const wheel = new MouseEvent("wheel", {clientX: 64, clientY: 32});
    Object.defineProperty(wheel, "deltaY", {value: -1});
    act(() => canvas.dispatchEvent(wheel));
    frame();
    expect(vi.mocked(render).mock.lastCall?.[2]?.scale).toBe(cameraBefore?.scale);
  });
  it("rotates single belts in both directions and dismisses the shortcut hint", () => {
    act(() => store.dispatch(setSelectedItem("conveyor")));
    expect(host.textContent).toContain("horaire / virage");
    const rotate = (shiftKey = false) => act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", {key: shiftKey ? "R" : "r", shiftKey}));
    });
    const place = (direction: string) => {
      mouse(canvas, "mousedown", 16, 16, 1);
      mouse(canvas, "mouseup", 16, 16);
      expect(controller.placeConveyorLine).toHaveBeenLastCalledWith([{x: 0, y: 0, direction}]);
    };
    for (const direction of ["down", "left", "up", "right"]) { rotate(); place(direction); }
    rotate(true); place("up");
    act(() => store.dispatch(setSelectedItem("miner")));
    expect(host.textContent).not.toContain("horaire / virage");
    rotate();
    mouse(canvas, "click", 48, 48);
    expect(controller.placeMiner).toHaveBeenCalledWith(1, 1, "standard");
    act(() => store.dispatch(setSelectedItem("conveyor")));
    place("up");
  });
  it.each(["splitter", "smart-splitter", "merger"] as const)("places and rotates %s using the belt shortcuts", type => {
    act(() => store.dispatch(setSelectedItem(type)));
    expect(host.textContent).toContain(type === "merger" ? "Merger" : type === "smart-splitter" ? "Splitter intelligent" : "Splitter");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "r"})));
    mouse(canvas, "click", 80, 112);
    expect(controller.placeConveyor).toHaveBeenLastCalledWith(2, 3, "down", type);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "R", shiftKey: true})));
    mouse(canvas, "click", 80, 112);
    expect(controller.placeConveyor).toHaveBeenLastCalledWith(2, 3, "right", type);
    mouse(canvas, "contextmenu", 80, 112);
    expect(host.textContent).not.toContain("horaire / virage");
  });
  it("draws a belt drag and cancels a release outside the canvas", () => {
    act(() => store.dispatch(setSelectedItem("conveyor")));
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "mousemove", 112, 16, 1);
    mouse(canvas, "mouseup", 112, 16);
    expect(controller.placeConveyorLine).toHaveBeenCalledWith([
      {x: 0, y: 0, direction: "right"}, {x: 1, y: 0, direction: "right"},
      {x: 2, y: 0, direction: "right"}, {x: 3, y: 0, direction: "right"}
    ]);
    vi.mocked(controller.placeConveyorLine).mockClear();
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(window, "mouseup", 700, 16);
    mouse(canvas, "mouseup", 112, 16);
    expect(controller.placeConveyorLine).not.toHaveBeenCalled();
  });
  it("cancels a drag when focus is lost or the tool is dismissed", () => {
    act(() => store.dispatch(setSelectedItem("conveyor")));
    mouse(canvas, "mousedown", 16, 16, 1);
    act(() => window.dispatchEvent(new Event("blur")));
    mouse(canvas, "mouseup", 112, 16);
    mouse(canvas, "mousedown", 16, 16, 1);
    mouse(canvas, "contextmenu", 16, 16);
    mouse(canvas, "mouseup", 112, 16);
    expect(controller.placeConveyorLine).not.toHaveBeenCalled();
  });
  it("pans and zooms while paused, retaining the camera after a world update", () => {
    mouse(canvas, "mousedown", 100, 100, 1);
    mouse(canvas, "mousemove", 164, 132, 1);
    mouse(canvas, "mouseup", 164, 132);
    mouse(canvas, "click", 164, 132); // Native browsers emit click after mouseup.
    frame();
    expect(vi.mocked(render).mock.lastCall?.[2]).toMatchObject({x: 64, y: 32, scale: 1});
    // happy-dom's WheelEvent currently omits MouseEvent coordinates.
    const wheel = new MouseEvent("wheel", {clientX: 64, clientY: 32});
    Object.defineProperty(wheel, "deltaY", {value: -1});
    act(() => canvas.dispatchEvent(wheel));
    frame();
    expect(vi.mocked(render).mock.lastCall?.[2]?.scale).toBeCloseTo(1.1);
    act(() => setWorldSnapshot(world(1))); frame();
    expect(vi.mocked(render).mock.lastCall?.[2]).toMatchObject({x: 64, y: 32});
    act(() => store.dispatch(setSelectedItem("storage")));
    mouse(canvas, "click", 64 + 80 * 1.1, 32 + 112 * 1.1);
    expect(controller.placeStorage).toHaveBeenCalledWith(2, 3);
  });
  it("pans with a right drag while keeping the selected construction", () => {
    act(() => store.dispatch(setSelectedItem("storage")));
    mouse(canvas, "mousedown", 100, 100, 2, 2);
    mouse(canvas, "mousemove", 164, 132, 2, 2);
    mouse(canvas, "mouseup", 164, 132, 0, 2);
    mouse(canvas, "contextmenu", 164, 132, 0, 2);
    frame();

    expect(vi.mocked(render).mock.lastCall?.[2]).toMatchObject({x: 64, y: 32, scale: 1});
    mouse(canvas, "click", 144, 144);
    expect(controller.placeStorage).toHaveBeenCalledWith(2, 3);
  });
  it("redraws after resize and does not rebind global listeners every tick", () => {
    const listeners = vi.spyOn(window, "addEventListener");
    act(() => setWorldSnapshot(world(1))); frame();
    expect(listeners).not.toHaveBeenCalled();
    vi.mocked(render).mockClear();
    act(() => root.render(tree(800, 600))); frame();
    expect(canvas.width).toBe(800); expect(canvas.height).toBe(600);
    expect(render).toHaveBeenCalled();
  });
});
