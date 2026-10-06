// @vitest-environment happy-dom
import {act, createElement, useState} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import store from "@web/store/store.ts";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice.ts";
import {Tutorial} from "./Tutorial.tsx";
import {tutorialSequences, tutorialSteps} from "./tutorialSteps.ts";

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let root: Root;
let host: HTMLDivElement;

function TutorialHarness() {
  const [step, setStep] = useState(0);
  return createElement("div", null,
    createElement("button", {"data-tutorial": "miner"}, "Mineur"),
    createElement(Tutorial, {step, steps: tutorialSteps, onStepChange: setStep, onClose: () => undefined})
  );
}

beforeEach(() => {
  store.dispatch(setSelectedItem(""));
  store.dispatch(setToolMode("build"));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(createElement(Provider, {store, children: createElement(TutorialHarness)})));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Tutorial", () => {
  it("introduces machine variants when level 2 unlocks them", () => {
    const variantStep = tutorialSequences["level-2"].find(step => step.title === "Choisis une variante");
    expect(variantStep?.description).toContain("compare les variantes");
    expect(variantStep?.tip).toContain("Industrielle produit plus et plus vite");
  });

  it("explains construction costs before introducing the recycler at level 2", () => {
    const costStep = tutorialSequences.basics.find(step => step.title === "Gère tes matériaux de construction");
    expect(costStep?.description).toContain("coût de l’élément choisi");
    expect(costStep?.tip).toContain("75 %");
    expect(costStep?.target).toBe("construction-materials");

    const recyclerStep = tutorialSequences["level-2"].find(step => step.title === "Transforme tes surplus en constructions");
    expect(recyclerStep?.description).toContain("n’importe quelle ressource");
    expect(recyclerStep?.tip).toContain("recette Recyclage");
    expect(recyclerStep?.expectedSelection).toBe("recycler");
  });

  it("targets every HUD value mentioned by the tutorial", () => {
    expect(tutorialSequences.basics.find(step => step.title === "Objectifs et tunnels")?.target)
      .toBe("campaign-objective");
    expect(tutorialSequences["level-2"].find(step => step.title === "Choisis une variante")?.target)
      .toBe("machine-variants");
    expect(tutorialSequences["level-2"].find(step => step.title === "Équilibre production et environnement")?.target)
      .toBe("campaign-pollution");
    expect(tutorialSequences["level-2"].find(step => step.title === "Adapte la cadence")?.target)
      .toBe("pause");
  });

  it("progresses through explanatory steps and gates interactive steps", () => {
    const continueButton = () => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!;
    act(() => continueButton().click());
    expect(host.textContent).toContain("Déplace-toi sur la carte");
    act(() => continueButton().click());
    expect(host.textContent).toContain("Le menu de construction");
    act(() => continueButton().click());
    expect(host.textContent).toContain("Gère tes matériaux de construction");
    act(() => continueButton().click());
    expect(host.textContent).toContain("Le mineur");
    expect(continueButton().disabled).toBe(true);
    expect(host.textContent).toContain("Ouvre le menu de construction avec A");
    expect(host.querySelector('[data-tutorial="miner"]')?.classList.contains("tutorial-target")).toBe(true);
    act(() => store.dispatch(setSelectedItem("miner")));
    expect(continueButton().disabled).toBe(false);
  });

  it("removes the highlight when the tutorial is unmounted", () => {
    act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!.click());
    act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!.click());
    act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!.click());
    act(() => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!.click());
    const target = host.querySelector('[data-tutorial="miner"]')!;
    expect(target.classList.contains("tutorial-target")).toBe(true);
    act(() => root.unmount());
    expect(target.classList.contains("tutorial-target")).toBe(false);
    root = createRoot(host);
  });
});
