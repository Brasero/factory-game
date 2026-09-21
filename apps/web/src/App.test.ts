// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import store from "@web/store/store.ts";
import App from "./App.tsx";
import {pauseGame, startGame} from "@web/game/GameController.ts";

vi.mock("@web/render/manager/AssetManager.ts", () => ({loadGameAssets: vi.fn(() => Promise.resolve())}));
vi.mock("@web/game/GameController.ts", () => ({startGame: vi.fn(), pauseGame: vi.fn()}));
vi.mock("@web/ui/Hud.tsx", () => ({Hud: () => createElement("div", {"data-testid": "hud"}, "HUD")}));
vi.mock("@web/render/GameCanvas.tsx", () => ({GameCanvas: () => createElement("div", {"data-testid": "canvas"}, "Canvas")}));

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let root: Root;
let host: HTMLDivElement;

const button = (label: string) => [...host.querySelectorAll("button")].find(item => item.textContent === label)!;

beforeEach(async () => {
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(createElement(Provider, {store, children: createElement(App)}));
    await Promise.resolve();
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("application menu", () => {
  it("waits at the main menu until the player starts", () => {
    expect(host.textContent).toContain("Factstories");
    expect(startGame).not.toHaveBeenCalled();
    act(() => button("Jouer").click());
    expect(startGame).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("Canvas");
    expect(host.textContent).not.toContain("Version de développement");
  });

  it("starts the tutorial and opens the pause menu with Escape", () => {
    act(() => button("Tutoriel").click());
    expect(host.textContent).toContain("Construis une chaîne de production");
    act(() => button("Quitter").click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(pauseGame).toHaveBeenCalled();
    expect(host.textContent).toContain("Jeu en pause");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(host.textContent).toContain("Canvas");
    expect(startGame).toHaveBeenCalledTimes(2);
  });
});
