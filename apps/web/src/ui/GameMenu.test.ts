// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, expect, it, vi} from "vitest";
import {GameMenu} from "./GameMenu";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";

vi.mock("@web/render/CanvasRenderer", () => ({render: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let root: Root;
let host: HTMLDivElement;
afterEach(() => { act(() => root?.unmount()); host?.remove(); });

it("shows the current save preview when Continue receives focus", () => {
  const world = createTestWorld();
  world.tick = 420;
  world.campaign.pollution = 125;
  const snapshot = new GameEngine(world).getSnapshot();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(createElement(GameMenu, {
    mode: "main", hasSave: true, savePreview: snapshot,
    onPlay: vi.fn(), onNewCampaign: vi.fn(), onTutorial: vi.fn()
  })));

  expect(host.textContent).not.toContain("PARTIE EN COURS");
  const continueButton = [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!;
  act(() => continueButton.focus());
  expect(host.textContent).toContain("PARTIE EN COURS");
  expect(host.textContent).toContain("Premiers lingots");
  expect(host.textContent).toContain("420 ticks");
  act(() => continueButton.blur());
  expect(host.textContent).not.toContain("PARTIE EN COURS");
});
