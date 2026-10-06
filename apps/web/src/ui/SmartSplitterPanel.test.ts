// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {afterEach, expect, it, vi} from "vitest";
import {SmartSplitterPanel} from "./SmartSplitterPanel";
import {setSmartSplitterFilter} from "@web/game/GameController";

vi.mock("@web/game/GameController", () => ({setSmartSplitterFilter: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let host: HTMLDivElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); host?.remove(); });

it("configures explicit and unfiltered smart splitter outputs", () => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const splitter = {id: "smart", x: 0, y: 0, entityType: "conveyor" as const, type: "smart-splitter" as const,
    direction: "right" as const, carrying: [], speed: 0.2, capacity: 3, outputFilters: {forward: "iron" as const}};
  act(() => root!.render(createElement(SmartSplitterPanel, {splitter, left: 0, top: 0, onClose: vi.fn()})));
  const selects = [...host.querySelectorAll("select")];
  expect(selects).toHaveLength(3);
  expect(selects[1].value).toBe("iron");
  act(() => {
    selects[0].value = "unfiltered";
    selects[0].dispatchEvent(new Event("change", {bubbles: true}));
  });
  expect(setSmartSplitterFilter).toHaveBeenCalledWith("smart", "left", "unfiltered");
});
