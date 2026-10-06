// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import store from "@web/store/store";
import {setSelectedItem, setSelectedVariant, setToolMode} from "@web/store/controlSlice";
import {setWorldSnapshot} from "@web/game/worldStore";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {createTestWorld} from "@engine/test/createTestWorld";
import {Hud} from "./Hud";

vi.mock("@web/game/GameController", () => ({pauseGame: vi.fn(), startGame: vi.fn()}));
vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: vi.fn(() => ({src: "asset.png"}))}}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  const world = createTestWorld();
  world.campaign.levels[1].status = "active";
  setWorldSnapshot(buildWorldSnapshot(world));
  store.dispatch(setToolMode("build"));
  store.dispatch(setSelectedItem("iron-smelter"));
  store.dispatch(setSelectedVariant("standard"));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(createElement(Provider, {store, children: createElement(Hud)})));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Machine variant selector", () => {
  it("shows the selected variant and its performance comparison above the active machine", () => {
    const panel = host.querySelector(".machine-variant-panel.floating")!;
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain("ÉcologiqueCadence×0,6Rendement×1Pollution×0,3");
    expect(panel.textContent).toContain("IndustrielleCadence×1,8Rendement×2Pollution×2,6");
    expect(host.textContent).toContain("Variante Standard");

    const eco = [...panel.querySelectorAll("button")].find(button => button.textContent?.startsWith("Écologique"))!;
    act(() => eco.click());

    expect(store.getState().control.selectedVariant).toBe("eco");
    expect(host.textContent).toContain("Variante Écologique");
  });
});
