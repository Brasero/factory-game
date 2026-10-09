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

it("explains restoration delivery costs, water connection and permanent absorption before accepting", () => {
  setWorldSnapshot(buildWorldSnapshot(createTestWorld()));
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  act(() => root.render(createElement(ContractsPanel)));
  act(() => host.querySelector("button")!.click());
  const card = [...host.querySelectorAll("article")].find(article => article.textContent?.includes("Restaurer les berges"))!;
  expect(card.textContent).toContain("20 lingots de fer");
  expect(card.textContent).toContain("30 eau");
  expect(card.textContent).toContain("par tuyau");
  expect(card.textContent).toContain("+0,03 absorption / s");
  expect(card.textContent).toContain("définitivement");
  act(() => card.querySelector("button")!.click());
  expect(acceptContract).toHaveBeenCalledWith("restore-marsh");
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
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent?.startsWith("Points d’expédition"))!.click());
  act(() => {const select = host.querySelector("select")!; select.value = "bridge"; select.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(assignContract).toHaveBeenCalledWith("depot", "bridge");
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Commandes")!.click());
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Annuler et libérer le stock")!.click());
  expect(cancelContract).toHaveBeenCalledWith("bridge");
  act(() => root.unmount()); host.remove(); vi.clearAllMocks();
});


it("archives completed contracts by default and permits shared assignments on finalized islands", () => {
  const world = createTestWorld(); world.campaign.levels[0].status = "finalized";
  world.campaign.contracts = {
    school: {id: "school", status: "completed", acceptedAt: 0, endedAt: 10, reserved: {}, sustained: 0, attempts: 1},
    port: {id: "port", status: "active", acceptedAt: 0, reserved: {}, sustained: 0, attempts: 1}
  };
  world.storages = [1, 2].map(number => ({id: `depot${number}`, depotNumber: number, kind: "shipping-depot", entityType: "storage", x: number, y: 0, stored: {}, capacity: 200, contractId: number === 1 ? "port" : undefined}));
  setWorldSnapshot(buildWorldSnapshot(world));
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  act(() => root.render(createElement(ContractsPanel))); act(() => host.querySelector("button")!.click());
  expect(host.querySelector<HTMLDetailsElement>(".contract-history")!.open).toBe(false);
  expect(host.querySelector(".contract-history summary")!.textContent).toContain("Contrats terminés (1)");
  expect(host.querySelectorAll(".contract-card").length).toBe(6);
  act(() => [...host.querySelectorAll("button")].find(button => button.textContent?.startsWith("Points d’expédition"))!.click());
  expect(host.textContent).toContain("Point n°1"); expect(host.textContent).toContain("Point n°2");
  const select = host.querySelectorAll("select")[1];
  expect(select.disabled).toBe(false);
  expect(select.querySelector<HTMLOptionElement>('option[value="port"]')!.disabled).toBe(false);
  act(() => {select.value = "port"; select.dispatchEvent(new Event("change", {bubbles: true}));});
  expect(assignContract).toHaveBeenCalledWith("depot2", "port");
  act(() => root.unmount()); host.remove(); vi.clearAllMocks();
});
