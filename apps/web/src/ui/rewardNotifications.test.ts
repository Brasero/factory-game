// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {createTestCampaign} from "@engine/test/createTestWorld";
import type {CampaignState} from "@engine/models/Campaign";
import {CAMPAIGN_LEVELS} from "@engine/config/campaignConfig";
import {useRewardNotifications} from "./rewardNotifications";

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let host: HTMLDivElement, root: Root;
function Probe({campaign}: {campaign: CampaignState}) {
  const {notices, gain} = useRewardNotifications(campaign);
  return createElement("output", null, JSON.stringify({notices, gain}));
}
beforeEach(() => {vi.useFakeTimers(); host = document.createElement("div"); document.body.append(host); root = createRoot(host);});
afterEach(() => {act(() => root.unmount()); host.remove(); vi.useRealTimers();});
const render = (campaign: CampaignState) => act(() => root.render(createElement(Probe, {campaign})));
const result = () => JSON.parse(host.textContent!) as {gain: number; notices: {title: string}[]};

it("shows all simultaneous rewards and their total beside materials without duplicating them", () => {
  const campaign = createTestCampaign(); render(campaign);
  const completed = structuredClone(campaign);
  completed.levels[0].challenges = {cadence: {value: 5, sustained: 100, baseline: {}, emissions: 0, attempts: 0, completedAt: 10}};
  // Use the configured challenge ID rather than duplicating its definition.
  completed.levels[0].challenges = {[CAMPAIGN_LEVELS[0].challenges![0].id]: completed.levels[0].challenges.cadence};
  completed.contracts = {school: {id: "school", status: "completed", acceptedAt: 0, endedAt: 10, reserved: {ironPlate: 15}, sustained: 0, attempts: 1}};
  render(completed);
  expect(result().notices).toHaveLength(2);
  expect(result().gain).toBe(35);
  render(structuredClone(completed));
  expect(result().gain).toBe(35); expect(result().notices).toHaveLength(2);
  act(() => vi.advanceTimersByTime(7999)); expect(result().notices).toHaveLength(2);
  act(() => vi.advanceTimersByTime(1)); expect(result()).toEqual({notices: [], gain: 0});
});

it("does not replay previously earned rewards when loading a campaign", () => {
  const campaign = createTestCampaign(); campaign.levels[0].completedAt = 5;
  render(campaign); expect(result()).toEqual({notices: [], gain: 0});
  campaign.constructionMaterials += 10; render(structuredClone(campaign));
  expect(result()).toEqual({notices: [], gain: 0});
});

it("announces finalization and its material gain once without replaying old finalizations", () => {
  const campaign = createTestCampaign();
  campaign.levels[1].status = "finalized";
  campaign.levels[1].finalizedAt = 2;
  render(campaign);
  expect(result()).toEqual({notices: [], gain: 0});
  const next = structuredClone(campaign);
  Object.assign(next.levels[0], {status: "finalized", finalizedAt: 10, finalizationReward: 30});
  render(next);
  expect(result().gain).toBe(30);
  expect(result().notices).toHaveLength(1);
  expect(host.textContent).toContain("Émissions de cette île réduites de 10 %");
  render(structuredClone(next));
  expect(result().gain).toBe(30);
  act(() => vi.advanceTimersByTime(8000));
  expect(result()).toEqual({notices: [], gain: 0});
});


it("clears pending notifications and timers when a new campaign starts", () => {
  const campaign = createTestCampaign(); render(campaign);
  campaign.levels[0].completedAt = 5; render(structuredClone(campaign));
  expect(result().gain).toBe(50);
  render(createTestCampaign()); expect(result()).toEqual({notices: [], gain: 0});
  expect(vi.getTimerCount()).toBe(0);
});
