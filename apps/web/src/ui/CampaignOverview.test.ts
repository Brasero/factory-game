// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {expect, it, vi} from "vitest";
import {createTestWorld} from "@engine/test/createTestWorld";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {CampaignOverview} from "./CampaignOverview";
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

it("shows optional challenges, exports and emission budgets without hiding the campaign", () => {
  const world = createTestWorld();
  world.campaign.levels[0].exports = {ironPlate: 4};
  const host = document.createElement("div"), root = createRoot(host);
  document.body.append(host);
  act(() => root.render(createElement(CampaignOverview, {world: buildWorldSnapshot(world)})));
  act(() => host.querySelector("button")!.click());
  expect(host.textContent).toContain("Cadence régulière");
  expect(host.textContent).toContain("Livraison propre");
  expect(host.textContent).toContain("Émissions");
  expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
  act(() => root.unmount()); host.remove(); vi.restoreAllMocks();
});
