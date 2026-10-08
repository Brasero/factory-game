// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import store from "@web/store/store.ts";
import App from "./App.tsx";
import {hasSavedGame, pauseGame, startGame, startNewCampaign} from "@web/game/GameController.ts";
import {getWorldSnapshot, setWorldSnapshot} from "@web/game/worldStore.ts";
import {emptyResources} from "@engine/models/Resources";
import {createTestCampaign} from "@engine/test/createTestWorld";
import {setPaused} from "@web/store/controlSlice";

vi.mock("@web/render/manager/AssetManager.ts", () => ({loadGameAssets: vi.fn(() => Promise.resolve())}));
vi.mock("@web/game/GameController.ts", () => ({startGame: vi.fn(), pauseGame: vi.fn(), startNewCampaign: vi.fn(),
  continueCampaign: vi.fn(() => true), hasSavedGame: vi.fn(() => false), getCurrentSnapshot: vi.fn(() => undefined)}));
vi.mock("@web/ui/Hud.tsx", () => ({Hud: () => createElement("div", {"data-testid": "hud"}, "HUD")}));
vi.mock("@web/ui/CampaignHud.tsx", () => ({CampaignHud: () => createElement("div", {"data-testid": "campaign"}, "Campaign")}));
vi.mock("@web/render/GameCanvas.tsx", () => ({GameCanvas: () => createElement("div", {"data-testid": "canvas"}, "Canvas")}));

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let root: Root;
let host: HTMLDivElement;

const button = (label: string) => [...host.querySelectorAll("button")].find(item => item.textContent === label)!;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(hasSavedGame).mockReturnValue(false);
  localStorage.removeItem("factstories-tutorials-disabled");
  store.dispatch(setPaused(false));
  const campaign = createTestCampaign();
  for (const level of campaign.levels.slice(1)) level.status = "locked";
  setWorldSnapshot({tick: 0, machines: [], conveyors: [], pipes: [], storages: [], tunnels: [], resources: emptyResources(), campaign});
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
  localStorage.removeItem("factstories-tutorials-disabled");
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
    expect(host.textContent).toContain("Construis ta première usine");
    expect(pauseGame).toHaveBeenCalled();
    expect(startGame).not.toHaveBeenCalled();
    act(() => button("Quitter").click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(pauseGame).toHaveBeenCalled();
    expect(host.textContent).toContain("Jeu en pause");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(host.textContent).toContain("Canvas");
    expect(startGame).toHaveBeenCalledTimes(1);
  });

  it("opens the level tutorial once when its mechanics unlock", async () => {
    act(() => button("Jouer").click());
    const next = structuredClone(getWorldSnapshot());
    next.campaign.levels[1].status = "active";
    await act(async () => { setWorldSnapshot(next); await Promise.resolve(); });
    expect(host.textContent).toContain("Un débit régulier");
    expect(pauseGame).toHaveBeenCalled();
    act(() => button("Quitter").click());
    await act(async () => { setWorldSnapshot({...next, tick: 1}); await Promise.resolve(); });
    expect(host.textContent).not.toContain("Un débit régulier");
  });

  it("pauses when a level becomes completed", async () => {
    act(() => button("Jouer").click());
    vi.mocked(pauseGame).mockClear();
    const next = structuredClone(getWorldSnapshot());
    next.campaign.levels[0].status = "completed";
    await act(async () => { setWorldSnapshot(next); await Promise.resolve(); });
    expect(pauseGame).toHaveBeenCalledOnce();
    expect(store.getState().control.paused).toBe(true);
  });

  it("disables manual tutorials and all unlock tutorials from the main settings", async () => {
    act(() => button("Paramètres").click());
    expect(host.textContent).toContain("Désactiver les tutoriels");
    act(() => host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(localStorage.getItem("factstories-tutorials-disabled")).toBe("true");
    act(() => button("Retour").click());
    expect(button("Tutoriel").disabled).toBe(true);
    act(() => button("Tutoriel").click());
    expect(host.textContent).not.toContain("Construis ta première usine");
    act(() => button("Jouer").click());
    vi.mocked(pauseGame).mockClear();
    for (let index = 1; index < 6; index++) {
      const next = structuredClone(getWorldSnapshot());
      next.campaign.levels[index].status = "active";
      await act(async () => {setWorldSnapshot(next); await Promise.resolve();});
      expect(host.querySelector('.tutorial-screen')).toBeNull();
      expect(host.textContent).not.toContain("Quitter");
    }
    expect(pauseGame).not.toHaveBeenCalled();
  });

  it("remembers the choice across remounts and skips the new campaign tutorial", async () => {
    act(() => button("Paramètres").click());
    act(() => host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    act(() => root.unmount());
    vi.mocked(hasSavedGame).mockReturnValue(true);
    vi.clearAllMocks();
    root = createRoot(host);
    await act(async () => {root.render(createElement(Provider, {store, children: createElement(App)})); await Promise.resolve();});
    expect(button("Tutoriel").disabled).toBe(true);
    act(() => button("Nouvelle campagne").click());
    expect(startNewCampaign).toHaveBeenCalledOnce();
    expect(startGame).toHaveBeenCalledOnce();
    expect(pauseGame).not.toHaveBeenCalled();
    expect(store.getState().control.paused).toBe(false);
    expect(host.textContent).not.toContain("Construis ta première usine");
  });

  it("returns from pause settings without resuming the simulation", () => {
    act(() => button("Jouer").click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    act(() => button("Paramètres").click());
    act(() => host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    vi.mocked(startGame).mockClear();
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(host.textContent).toContain("Jeu en pause");
    expect(button("Tutoriel").disabled).toBe(true);
    expect(store.getState().control.paused).toBe(true);
    expect(startGame).not.toHaveBeenCalled();
    act(() => button("Reprendre").click());
    expect(startGame).toHaveBeenCalledOnce();
  });

  it("allows re-enabling tutorials and returning to the main menu with Escape", () => {
    act(() => button("Paramètres").click());
    act(() => host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})));
    expect(host.textContent).toContain("Version de développement");
    act(() => button("Paramètres").click());
    expect(host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
    act(() => host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    act(() => button("Retour").click());
    expect(button("Tutoriel").disabled).toBe(false);
    expect(localStorage.getItem("factstories-tutorials-disabled")).toBe("false");
    act(() => button("Tutoriel").click());
    expect(host.textContent).toContain("Construis ta première usine");
  });

});
