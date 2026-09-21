// @vitest-environment happy-dom
import {act, createElement, useState} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Provider} from "react-redux";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import store from "@web/store/store.ts";
import {setSelectedItem, setToolMode} from "@web/store/controlSlice.ts";
import {Tutorial} from "./Tutorial.tsx";

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
let root: Root;
let host: HTMLDivElement;

function TutorialHarness() {
  const [step, setStep] = useState(0);
  return createElement("div", null,
    createElement("button", {"data-tutorial": "miner"}, "Mineur"),
    createElement(Tutorial, {step, onStepChange: setStep, onClose: () => undefined})
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
  it("progresses through explanatory steps and gates interactive steps", () => {
    const continueButton = () => [...host.querySelectorAll("button")].find(button => button.textContent === "Continuer")!;
    act(() => continueButton().click());
    expect(host.textContent).toContain("Objectifs et pollution");
    act(() => continueButton().click());
    expect(host.textContent).toContain("Déplace-toi sur la carte");
    act(() => continueButton().click());
    expect(host.textContent).toContain("Le mineur");
    expect(continueButton().disabled).toBe(true);
    expect(host.querySelector('[data-tutorial="miner"]')?.classList.contains("tutorial-target")).toBe(true);
    act(() => store.dispatch(setSelectedItem("miner")));
    expect(continueButton().disabled).toBe(false);
  });

  it("removes the highlight when the tutorial is unmounted", () => {
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
