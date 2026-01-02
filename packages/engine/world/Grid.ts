import {Position} from "@engine/models/Position";
import {GridCell} from "@engine/models/GridCell";
import type {MachineType} from "@engine/models/Machine.ts";
import type {World} from "@engine/models/World.ts";

// Classe représentant une grille 2D pour la gestion des positions occupées
// et libres
// dans un espace défini par une largeur et une hauteur.
// Chaque cellule de la grille peut être occupée ou libre.
// Fournit des méthodes pour vérifier les limites, l'occupation,
// occuper et libérer des positions.
// Pour chaque methode x représente la colonne et y la ligne. (standard cartésien)

/**
 * Classe représentant une grille 2D pour la gestion des positions occupées
 * et libres dans un espace défini par une largeur et une hauteur.
 *
 * @class Grid
 * @property {number} width - La largeur de la grille.
 * @property {number} height - La hauteur de la grille.
 * @property {GridCell[][]} cells - La matrice des cellules de la grille.
 * @method isInside(pos: Position): boolean - Vérifie si une position est à l'intérieur de la grille.
 * @method isOccupied(pos: Position): boolean - Vérifie si une position est occupée.
 * @method occupy(pos: Position): boolean - Occupe une position dans la grille si elle est dans les limites et non occupée.
 * @method free(pos: Position): void - Libère une position dans la grille si elle est dans les limites.
 * @example
 * const grid = new Grid(10, 10);
 * grid.occupy({x: 2, y: 3});
 * console.log(grid.isOccupied({x: 2, y: 3})); // true
 * grid.free({x: 2, y: 3});
 * console.log(grid.isOccupied({x: 2, y: 3})); // false
 */
export class Grid {
  readonly width: number;
  readonly height: number;
  
  private cells: GridCell[][];
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ occupied: false }))
    );
  }
  
  // Verifie si une position est à l'intérieur de la grille
  isInside({x, y}: Position): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }
  
  // Verifie si une position est occupée
  isOccupied(pos: Position): boolean {
    if (!this.isInside(pos)) return true;
    return this.cells[pos.y][pos.x].occupied;
  }
  
  // Occupe une position dans la grille si elle est dans les limites et non occupée
  occupy(pos: Position) {
    if (!this.isInside(pos)) return false;
    if (this.isOccupied(pos)) return false;
    this.cells[pos.y][pos.x].occupied = true;
    return true;
  }
  
  canPlaceMachine(
    pos: Position,
    machineType: MachineType,
    world: World
  ): boolean {
    if (this.isOccupied(pos)) return false;
    if (!this.isInside(pos)) return false;
    
    const node = world.resourceNodes.find(n => n.x === pos.x && n.y === pos.y)
    
    switch(machineType) {
      
      case "iron-mine":
        return node?.resource === "iron";
      case "coal-mine":
        return node?.resource === "coal";
      case "water-pump":
        return node?.resource === "water";
      
      default:
        return true;
    }
  }
  
  // Libère une position dans la grille si elle est dans les limites
  free(pos: Position): void {
    if (!this.isInside(pos)) return;
    this.cells[pos.y][pos.x].occupied = false;
  }
}