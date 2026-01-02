import {describe, it, expect} from "vitest";
import {createWorld} from "./WorldFactory";

describe("Creation du monde", () => {
  it("Doit creer un monde avec les proprietes initiales", () => {
    const world = createWorld();

    expect(world.tick, "Le temps du monde ne commence pas à 0").toBe(0);
    expect(world.grid.width, "La largeur du monde ne vaut pas 20").toBe(20);
    expect(world.grid.height, "La hauteur du monde ne vaut pas 15").toBe(15);
    expect(world.machines, "Le monde ne devrait contenir aucune machine").toEqual([]);
    expect(world.resources, "Le stock de ressources n'est pas à 0").toEqual({ iron: 0 });
  })
})