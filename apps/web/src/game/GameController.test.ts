import {describe, it, expect} from "vitest";
import * as GameController from "./GameController";
import {createWorld} from "@engine/world/WorldFactory.ts";

describe("GameController", () => {
  it("Placement d'une mine de fer", () => {
    const success = GameController.placeIronMine(1, 1);
    expect(success, "La mine de fer devrait être placée avec succès").toBe(true);
  })
  it("Ne doit pas placer une mine de fer sur une position occupée", () => {
    const success = GameController.placeIronMine(1, 1);
    expect(success, "La mine de fer ne devrait pas être placée sur une position occupée").toBe(false);
  })
  it("Ne doit pas placer une mine de fer en dehors des limites", () => {
    const world = createWorld();
    const width = world.grid.width;
    const height = world.grid.height;
    const success = GameController.placeIronMine(width + 1, height + 1);
    expect(success, "La mine de fer ne devrait pas être placée en dehors des limites").toBe(false);
  })
  it("Placement d'une mine de charbon", () => {
    const success = GameController.placeCoalMine(1, 2);
    expect(success, "La mine de charbon devrait être placée avec succès").toBe(true);
  })
  it("Ne doit pas placer une mine de charbon sur une position occupée", () => {
    const success = GameController.placeCoalMine(1, 2);
    expect(success, "La mine de charbon ne devrait pas être placée sur une position occupée").toBe(false);
  })
  it("Ne doit pas placer une mine de charbon en dehors des limites", () => {
    const world = createWorld();
    const width = world.grid.width;
    const height = world.grid.height;
    const success = GameController.placeCoalMine(width + 1, height + 1);
    expect(success, "La mine de charbon ne devrait pas être placée en dehors des limites").toBe(false);
  })
  it("Placement d'une pompe à eau", () => {
    const success = GameController.placeWaterPump(2, 3);
    expect(success, "La pompe à eau devrait être placée avec succès").toBe(true);
  })
  it("Ne doit pas placer une pompe à eau sur une position occupée", () => {
    const success = GameController.placeWaterPump(2, 3);
    expect(success, "La pompe à eau ne devrait pas être placée sur une position occupée").toBe(false);
  })
  it("Ne doit pas placer une pompe à eau en dehors des limites", () => {
    const world = createWorld();
    const width = world.grid.width;
    const height = world.grid.height;
    const success = GameController.placeWaterPump(width + 1, height + 1);
    expect(success, "La pompe à eau ne devrait pas être placée en dehors des limites").toBe(false);
  })
})