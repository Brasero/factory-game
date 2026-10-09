// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, describe, expect, it, vi} from "vitest";
import {CampaignHud} from "./CampaignHud";
import {setWorldSnapshot} from "@web/game/worldStore";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {createTestWorld} from "@engine/test/createTestWorld";
import {finalizeLevel} from "@web/game/GameController";

vi.mock("@web/game/GameController", () => ({activateLevel: vi.fn(), finalizeLevel: vi.fn()}));
vi.mock("@web/render/manager/AssetManager", () => ({assetManager: {getImage: vi.fn(() => ({src: "resource.png"}))}}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let root: Root;
let host: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  vi.clearAllMocks();
});

describe("Campaign game over", () => {
  it("allows the player to restart the campaign", () => {
    const world = createTestWorld();
    world.campaign.status = "game-over";
    setWorldSnapshot(buildWorldSnapshot(world));
    const restart = vi.fn();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(CampaignHud, {onRestart: restart, onContinue: vi.fn(), onMainMenu: vi.fn()})));

    const button = [...host.querySelectorAll("button")].find(item => item.textContent === "Recommencer une campagne")!;
    expect(button).toBeTruthy();
    act(() => button.click());
    expect(restart).toHaveBeenCalledOnce();
  });

  it("shows only unlocked resources and reveals later resources when an island unlocks", () => {
    const world = createTestWorld();
    world.campaign.levels.forEach((level, index) => { level.status = index === 0 ? "active" : "locked"; });
    setWorldSnapshot(buildWorldSnapshot(world));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(CampaignHud, {onRestart: vi.fn(), onContinue: vi.fn(), onMainMenu: vi.fn()})));

    const resources = host.querySelector('[aria-label="Ressources stockées"]')!;
    expect(resources.children).toHaveLength(3);
    expect(resources.querySelector('[aria-label="Matériaux de construction : 150"]')).toBeTruthy();
    expect(resources.querySelector('[aria-label="Fer : 0"]')).toBeTruthy();
    expect(resources.querySelector('[aria-label="Uranium : 0"]')).toBeNull();
    expect(resources.querySelector('[aria-label="Cœurs : 0"]')).toBeNull();
    expect(resources.querySelector('[aria-label="Circuits : 0"]')).toBeNull();

    world.campaign.levels[0].status = "finalized";
    world.campaign.levels[1].status = "completed";
    world.campaign.levels[2].status = "active";
    act(() => setWorldSnapshot(buildWorldSnapshot(world)));
    expect(resources.querySelector('[aria-label="Circuits : 0"]')).toBeTruthy();
    expect(resources.querySelector('[aria-label="Fer : 0"]')).toBeTruthy();
    expect(resources.querySelector('[aria-label="Uranium : 0"]')).toBeNull();

    world.campaign.levels.forEach(level => { level.status = "completed"; });
    act(() => setWorldSnapshot(buildWorldSnapshot(world)));
    expect(resources.children).toHaveLength(13);
    expect(resources.querySelector('[aria-label="Cœurs : 0"]')).toBeTruthy();
    expect(resources.querySelector(".pulse")).toBeNull();
  });

  it("offers free play, restart and main menu actions after victory", () => {
    const world = createTestWorld();
    world.campaign.status = "finished";
    setWorldSnapshot(buildWorldSnapshot(world));
    const onContinue = vi.fn(), onRestart = vi.fn(), onMainMenu = vi.fn();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(CampaignHud, {onRestart, onContinue, onMainMenu})));

    const buttons = [...host.querySelectorAll("button")];
    act(() => buttons.find(item => item.textContent === "Continuer à jouer")!.click());
    act(() => buttons.find(item => item.textContent === "Relancer une campagne")!.click());
    act(() => buttons.find(item => item.textContent === "Revenir au menu principal")!.click());
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onRestart).toHaveBeenCalledOnce();
    expect(onMainMenu).toHaveBeenCalledOnce();
  });

  it("warns before permanently finalizing an island", () => {
    const world = createTestWorld();
    world.campaign.levels[0].status = "completed";
    setWorldSnapshot(buildWorldSnapshot(world));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(CampaignHud, {onRestart: vi.fn(), onContinue: vi.fn(), onMainMenu: vi.fn()})));

    expect(host.querySelector('[role="alert"]')?.textContent).toContain("VERROUILLAGE DÉFINITIF");
    expect(host.textContent).toContain("+30 matériaux de construction immédiatement");
    expect(host.textContent).toContain("−10 % d’émissions sur cette île, de façon permanente");
    expect(host.textContent).toContain("empêchera définitivement la construction, la destruction et les changements de recette");

    const button = [...host.querySelectorAll("button")]
      .find(item => item.textContent?.includes("Finaliser et verrouiller définitivement"))!;
    act(() => button.click());
    expect(finalizeLevel).toHaveBeenCalledWith("level-1");
  });
});
