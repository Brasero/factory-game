// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, describe, expect, it, vi} from "vitest";
import {CampaignHud} from "./CampaignHud";
import {setWorldSnapshot} from "@web/game/worldStore";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {createTestWorld} from "@engine/test/createTestWorld";

vi.mock("@web/game/GameController", () => ({activateLevel: vi.fn(), finalizeLevel: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let root: Root;
let host: HTMLDivElement;
afterEach(() => { act(() => root?.unmount()); host?.remove(); });

describe("Campaign game over", () => {
  it("allows the player to restart the campaign", () => {
    const world = createTestWorld();
    world.campaign.status = "game-over";
    setWorldSnapshot(buildWorldSnapshot(world));
    const restart = vi.fn();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(CampaignHud, {onRestart: restart})));

    const button = [...host.querySelectorAll("button")].find(item => item.textContent === "Recommencer une campagne")!;
    expect(button).toBeTruthy();
    act(() => button.click());
    expect(restart).toHaveBeenCalledOnce();
  });
});
