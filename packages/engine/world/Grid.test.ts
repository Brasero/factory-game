import {describe, it, expect} from "vitest";
import {Grid} from "./Grid";

describe("Fonctionnement de la grille", () => {
  const grid = new Grid(10, 10);
  it("Doit verifier si une position est a l'interieur de la grille", () => {
    expect(grid.isInside({x: 5, y: 5}), "La position (5,5) devrait être à l'intérieur de la grille").toBe(true);
    expect(grid.isInside({x: -1, y: 5}), "La position (-1,5) devrait être à l'extérieur de la grille").toBe(false);
  });
  it("Doit verifier si une position est occupee", () => {
    expect(grid.isOccupied({x: 2, y: 2}), "La position (2,2) ne devrait pas être occupée").toBe(false);
    grid.occupy({x: 2, y: 2});
    expect(grid.isOccupied({x: 2, y: 2}), "La position (2,2) devrait être occupée").toBe(true);
  });
  it("Doit occuper une position dans la grille", () => {
    const result = grid.occupy({x: 3, y: 3});
    expect(result, "La position (3,3) devrait pouvoir être occupée").toBe(true);
    expect(grid.isOccupied({x: 3, y: 3}), "La position (3,3) devrait être occupée après l'occupation").toBe(true);
  });
  it("Doit liberer une position dans la grille", () => {
    grid.occupy({x: 4, y: 4});
    grid.free({x: 4, y: 4});
    expect(grid.isOccupied({x: 4, y: 4}), "La position (4,4) ne devrait pas être occupée après la libération").toBe(false);
  });
  it("Ne doit pas occuper une position hors des limites", () => {
    const result = grid.occupy({x: 10, y: 10});
    expect(result, "La position (10,10) ne devrait pas pouvoir être occupée car elle est hors des limites").toBe(false);
  })
  it("Ne doit pas occuper une position deja occupee", () => {
    grid.occupy({x: 5, y: 5});
    const result = grid.occupy({x: 5, y: 5});
    expect(result, "La position (5,5) ne devrait pas pouvoir être occupée car elle est déjà occupée").toBe(false);
  })
});