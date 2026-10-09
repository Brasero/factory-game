// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {afterEach, expect, it, vi} from "vitest";
import {LogisticsPanel} from "./LogisticsPanel";
import {setConveyorRegulation, setStorageReserve} from "@web/game/GameController";
import {setWorldSnapshot} from "@web/game/worldStore";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {createTestWorld} from "@engine/test/createTestWorld";

vi.mock("@web/game/GameController", () => ({setConveyorRegulation: vi.fn(), setStorageReserve: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
afterEach(() => {act(() => root?.unmount()); host?.remove(); vi.clearAllMocks();});
const setup = () => {
  setWorldSnapshot(buildWorldSnapshot(createTestWorld()));
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
};

it("configures a limiter and priority independently and explains starvation", () => {
  setup();
  const entity = {id: "split", x: 0, y: 0, entityType: "conveyor" as const, type: "splitter" as const,
    direction: "right" as const, speed: 0.2, capacity: 3, carrying: [], outputRate: 3, priorityPort: "left" as const};
  act(() => root.render(createElement(LogisticsPanel, {entity, left: 0, top: 0, onClose: vi.fn()})));
  const [rate, priority] = [...host.querySelectorAll("select")];
  expect(rate.value).toBe("3"); expect(priority.value).toBe("left");
  expect(host.textContent).toContain("priver les autres chaînes");
  act(() => {rate.value = "5"; rate.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setConveyorRegulation).toHaveBeenCalledWith("split", 5, "left");
  act(() => {rate.value = "0.3"; rate.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setConveyorRegulation).toHaveBeenCalledWith("split", 0.3, "left");
  act(() => {priority.value = "balanced"; priority.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setConveyorRegulation).toHaveBeenCalledWith("split", 3, undefined);
});

it("configures a reserve, displays its storage cost and disables it after finalization", () => {
  setup();
  const entity = {id: "stock", x: 0, y: 0, entityType: "storage" as const, capacity: 100, stored: {iron: 8}, reserveThreshold: 5};
  act(() => root.render(createElement(LogisticsPanel, {entity, left: 0, top: 0, onClose: vi.fn()})));
  const input = host.querySelector("input")!;
  expect(input.value).toBe("5"); expect(host.textContent).toContain("toutes ressources confondues");
  act(() => {Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "10"); input.dispatchEvent(new Event("input", {bubbles: true}));});
  expect(setStorageReserve).toHaveBeenCalledWith("stock", 10);
  const world = createTestWorld(); world.campaign.levels[0].status = "finalized";
  act(() => setWorldSnapshot(buildWorldSnapshot(world)));
  expect(input.disabled).toBe(true);
});
