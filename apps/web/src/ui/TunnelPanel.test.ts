// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {expect, it, vi} from "vitest";
import {TunnelPanel} from "./TunnelPanel";
import {setTunnelFilter} from "@web/game/GameController";
import {emptyResources} from "@engine/models/Resources";
vi.mock("@web/game/GameController", () => ({setTunnelFilter: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
it("lets the player select steel without emptying the iron stock and return to automatic output", () => {
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  act(() => root.render(createElement(TunnelPanel, {tunnel: {id: "entry", entityType: "tunnel", type: "input", levelId: "level-2", x: 1, y: 0,
    direction: "right", capacity: 200, stored: {...emptyResources(), ironPlate: 200, steel: 12}}, left: 0, top: 0, onClose: vi.fn()})));
  expect(host.querySelectorAll("select")).toHaveLength(4);
  const select = host.querySelector<HTMLSelectElement>('select[aria-label="Sortie droite"]')!;
  expect(host.textContent).toContain("lingots de fer · 200 en stock");
  expect(host.textContent).toContain("lingots d’acier · 12 en stock");
  act(() => {select.value = "steel"; select.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setTunnelFilter).toHaveBeenLastCalledWith("entry", "right", "steel");
  act(() => {select.value = "unfiltered"; select.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setTunnelFilter).toHaveBeenLastCalledWith("entry", "right", "unfiltered");
  const left = host.querySelector<HTMLSelectElement>('select[aria-label="Sortie gauche"]')!;
  act(() => {left.value = "ironPlate"; left.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setTunnelFilter).toHaveBeenLastCalledWith("entry", "left", "ironPlate");
  act(() => {left.value = "none"; left.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(setTunnelFilter).toHaveBeenLastCalledWith("entry", "left", "none");
  act(() => root.unmount()); host.remove(); vi.clearAllMocks();
});
