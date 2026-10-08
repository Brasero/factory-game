// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {expect, it, vi} from "vitest";
import {ContractsPanel} from "./ContractsPanel";
import {setWorldSnapshot} from "@web/game/worldStore";
import {buildWorldSnapshot} from "@engine/api/worldSnapshot";
import {createTestWorld} from "@engine/test/createTestWorld";
import {acceptContract, assignContract, cancelContract} from "@web/game/GameController";

vi.mock("@web/game/GameController", () => ({acceptContract: vi.fn(), assignContract: vi.fn(), cancelContract: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

it("offers only unlocked contracts and explains resource consumption before acceptance", () => {
  const world = createTestWorld(); world.campaign.levels.slice(1).forEach(level => {level.status = "locked";});
  setWorldSnapshot(buildWorldSnapshot(world));
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  act(() => root.render(createElement(ContractsPanel)));
  act(() => host.querySelector("button")!.click());
  expect(host.textContent).toContain("Un atelier pour apprendre");
  expect(host.textContent).not.toContain("Réparer le port");
  expect(host.textContent).toContain("sans compter pour les objectifs de campagne");
  const accept = [...host.querySelectorAll("button")].find(button => button.textContent === "Accepter")!;
  act(() => accept.click()); expect(acceptContract).toHaveBeenCalledWith("school");
  act(() => root.unmount()); host.remove(); vi.clearAllMocks();
});

it("shows simulated deadlines and dispatches assignment and cancellation", () => {
  const world = createTestWorld(); world.tick = 300;
  world.campaign.contracts = {bridge: {id: "bridge", status: "active", acceptedAt: 0, deadlineAt: 1800, reserved: {steel: 5}, sustained: 0, attempts: 1}};
  world.storages = [{id: "depot", kind: "shipping-depot", entityType: "storage", x: 0, y: 0, stored: {steel: 5}, capacity: 200}];
  setWorldSnapshot(buildWorldSnapshot(world));
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  act(() => root.render(createElement(ContractsPanel)));
  act(() => host.querySelector("button")!.click());
  expect(host.textContent).toContain("150 s simulées");
  expect(host.textContent).toContain("5 / 12");
  act(() => {const select = host.querySelector("select")!; select.value = "bridge"; select.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(assignContract).toHaveBeenCalledWith("depot", "bridge");
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Annuler et libérer le stock")!.click());
  expect(cancelContract).toHaveBeenCalledWith("bridge");
  act(() => root.unmount()); host.remove(); vi.clearAllMocks();
});
