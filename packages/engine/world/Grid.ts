import {Position} from "@engine/models/Position";
import {GridCell} from "@engine/models/GridCell";
import type {MachineType} from "@engine/models/Machine.ts";
import type {World} from "@engine/models/World.ts";
import type {TileMap} from "@engine/world/TileMap.ts";
import {resourceNodes} from "@engine/world/resourceNode.ts";
import type {TileData} from "@engine/models/Tile.ts";

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
  
  private readonly cells: GridCell[][];
  
  constructor(width: number, height: number, tileMap: TileMap) {
    this.width = width;
    this.height = height;
    
    this.cells = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => ({
        occupied: false,
        tile: tileMap.get(x, y)?.biome ?? "grass",
        variant: tileMap.get(x, y)?.variant ?? 0,
        resource: null,
        decoration: tileMap.get(x, y)?.decoration ? {
          ...tileMap.get(x, y)!.decoration!,
          destructible: tileMap.get(x, y)!.decoration!.type === "tree"
        } : undefined
      }))
    );
  }
  
  /**
   * Renvoie les données de la tuile à la position spécifiée si elle existe dans la grille.
   * @param {number} x - La coordonnée x de la tuile.
   * @param {number} y - La coordonnée y de la tuile.
   * @returns {TileData | null} Les données de la tuile ou null si la position est en dehors de la grille.
   */
  getTile(x: number, y: number): TileData | null {
    if (!this.isInside({x, y})) return null;
    const cell = this.cells[y][x];
    return {
      biome: cell.tile,
      variant: cell.variant,
      decoration: cell.decoration ?? undefined
    };
  }
  /**
   * Renvoie une carte des ressources présentes dans la grille.
   * @returns {(TileData & { resource: GridCell["resource"] })[]} Une liste des cellules contenant des ressources avec leurs données de tuile.
   */
  getResourceMap(): (TileData & { resource: GridCell["resource"] })[] {
    const map: (TileData & {resource: GridCell["resource"]})[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell.resource) {
          map.push({
            biome: cell.tile,
            variant: cell.variant,
            decoration: cell.decoration ?? undefined,
            resource: cell.resource
          });
        }
      }
    }
    return map;
  }
  
  /**
   * Vérifie si une position est à l'intérieur de la grille.
   * @param {number} x - La coordonnée x.
   * @param {number} y - La coordonnée y.
   */
  isInside({x, y}: Position): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }
  
  /**
   * Définit la ressource à la position spécifiée dans la grille.
   * @param {number} x - La coordonnée x de la cellule.
   * @param {number} y - La coordonnée y de la cellule.
   * @param {GridCell["resource"]} resource - La ressource à définir parmis les ressource possible.
   */
  setResource(x: number, y: number, resource: GridCell["resource"]) {
    if (!this.isInside({x, y})) return;
    this.cells[y][x].resource = resource;
  }
  
  /**
   * Vérifie si une position est occupée.
   * @param {Position} pos - La position a vérifié
   */
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
    machineType: MachineType | string
  ): boolean {
    if (this.isOccupied(pos)) return false;
    if (!this.isInside(pos)) return false;
    
    const cell = this.cells[pos.y][pos.x];
    
    // interdit sur la mer
    if (cell.tile === "sea") return false;
    if (cell.decoration) return false;
    
    switch(machineType) {
      case "iron-mine":
        return cell.resource === "iron";
      case "coal-mine":
        return cell.resource === "coal";
      case "water-pump":
        return cell.resource === "water";
      
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