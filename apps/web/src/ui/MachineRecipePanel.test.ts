// @vitest-environment happy-dom
import {act, createElement} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, describe, expect, it, vi} from "vitest";
import {MachineRecipePanel} from "./MachineRecipePanel";
import {setWorldSnapshot} from "@web/game/worldStore";
import {GameEngine} from "@engine/core/GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import {setMachinePaused} from "@web/game/GameController";

vi.mock("@web/game/GameController", () => ({selectMachineRecipe: vi.fn(), setMachinePaused: vi.fn()}));
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

let root: Root;
let host: HTMLDivElement;
afterEach(() => { act(() => root?.unmount()); host?.remove(); });

describe("Machine recipe panel", () => {
  it("shows newly unlocked recipes and their distinct cadence", () => {
    const world = createTestWorld();
    world.campaign.levels[1].status = "active";
    const engine = new GameEngine(world);
    engine.placeMachine(0, 0, "iron-smelter");
    const snapshot = engine.getSnapshot();
    setWorldSnapshot(snapshot);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(MachineRecipePanel, {
      machine: snapshot.machines[0], left: 0, top: 0, onClose: vi.fn()
    })));

    expect(host.textContent).toContain("Lingot de fer1 Minerai de fer → 1 Lingot de fer20 ticks");
    expect(host.textContent).toContain("Acier1 Lingot de fer + 1 Charbon → 1 Acier30 ticks");
    expect(host.textContent).toContain("Mettre en pause");
    const pause = [...host.querySelectorAll("button")].find(button => button.textContent?.includes("Mettre en pause"))!;
    act(() => pause.click());
    expect(setMachinePaused).toHaveBeenCalledWith(snapshot.machines[0].id, true);
  });

  it("offers copper wire and circuit recipes on the same production machine", () => {
    const world = createTestWorld();
    const engine = new GameEngine(world);
    engine.placeMachine(0, 0, "assembler");
    const snapshot = engine.getSnapshot();
    setWorldSnapshot(snapshot);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(MachineRecipePanel, {
      machine: snapshot.machines[0], left: 0, top: 0, onClose: vi.fn()
    })));

    expect(host.textContent).toContain("Fil de cuivre1 Cuivre → 2 Fil de cuivre18 ticks");
    expect(host.textContent).toContain("Circuit1 Lingot de fer + 2 Fil de cuivre → 1 Circuit35 ticks");
  });

  it("explains the boiler pollution reduction", () => {
    const world = createTestWorld();
    const engine = new GameEngine(world);
    engine.placeMachine(0, 0, "boiler");
    const snapshot = engine.getSnapshot();
    setWorldSnapshot(snapshot);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(createElement(MachineRecipePanel, {
      machine: snapshot.machines[0], left: 0, top: 0, onClose: vi.fn()
    })));

    expect(host.textContent).toContain("Dépollution à l’eau1 Eau → −12 pollution20 ticks");
  });
});
