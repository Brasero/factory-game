import type {World} from "@engine/models/World.ts";
import type {Position} from "@engine/models/Position.ts";
import {colors} from "@web/theme/colors.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";

const CELL_SIZE = 40;
export function render(
    ctx: CanvasRenderingContext2D,
    world: World,
    hoveredCell?: Position & {canPlace: boolean}
) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    drawGrid(ctx, width, height);
    drawResourceNodes(ctx, world);
    drawMachines(ctx, world);
    drawConveyors(ctx, world);
    drawResources(ctx, world);
    drawStorages(ctx, world);
    drawHoveredCell(ctx, hoveredCell);
}

/* ========================= */
/* ========== GRID ========= */
/* ========================= */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += CELL_SIZE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

/* ========================= */
/* ======== MACHINES ======= */
/* ========================= */

function drawMachines(
  ctx: CanvasRenderingContext2D,
  world: World
) {
    world.machines.forEach(m => {
        ctx.fillStyle = colors.machine.extractor;
        ctx.fillRect(m.x * CELL_SIZE + 4, m.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8)
    })
}


/* ========================= */
/* ======== SURVOL ======= */
/* ========================= */

function drawHoveredCell(
  ctx: CanvasRenderingContext2D,
  cell?: Position & {canPlace: boolean}
) {
    if (!cell) return
    
    ctx.fillStyle = cell.canPlace ? colors.state.success : colors.state.danger;
    ctx.fillRect(
      cell.x * CELL_SIZE,
      cell.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    )
}

/* ========================= */
/* == NOEUD DE RESSOURCES == */
/* ========================= */

function drawResourceNodes(
  ctx: CanvasRenderingContext2D,
  world: World
) {
    world.resourceNodes.forEach(node => {
        switch (node.resource) {
            case "iron":
                ctx.fillStyle = colors.resource.iron;
                break;
            case "coal":
                ctx.fillStyle = colors.resource.coal;
                break;
            case "water":
                ctx.fillStyle = colors.resource.water;
                break;
        }
        ctx.fillRect(
          node.x * CELL_SIZE,
          node.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        )
    })
}

/* ========================= */
/*  CONVOYEUR DE RESOURCES   */
/* ========================= */

function drawConveyors(ctx: CanvasRenderingContext2D, world: World) {
    world.conveyors.forEach(c => {
        const px = c.x * CELL_SIZE;
        const py = c.y * CELL_SIZE;
        const s = CELL_SIZE;
        
        // Trouver les voisins convoyeurs
        const neighbors = getNeighborDirections(c.x, c.y, world)
        
        ctx.fillStyle = colors.machine.logistics;
        
        // Lignes droites ou virage
        if (neighbors.length === 2) {
            const pair = neighbors.sort().join("-");
            if (pair === "left-right" || pair === "right-left") {
                ctx.fillRect(px, py + 10, s, s-20); // horizontale
            } else if (pair === "up-down" || pair === "down-up") {
                ctx.fillRect(px + 10, py, s-20, s); // verticale
            } else {
                // Virage en L
                ctx.beginPath();
                const [a, b] = neighbors;
                // Début du L au centre
                ctx.moveTo(px + 10, py + 10);
                
                if ((a === "up" && b === "right") || (a === "right" && b === "up")) {
                    ctx.lineTo(px + 10, py);      // vers haut
                    ctx.lineTo(px + s - 10, py);  // vers droite
                    ctx.lineTo(px + s - 10, py + 10); // vers bas
                    ctx.lineTo(px + s, py+10) // vers la droite
                    ctx.lineTo(px + s, py + s - 10) // vers le bas
                    ctx.lineTo(px + 10, py + s - 10) // vers la gauche
                } else if ((a === "up" && b === "left") || (a === "left" && b === "up")) {
                    ctx.lineTo(px + 10, py);      // vers haut
                    ctx.lineTo(px + s - 10, py);  // vers droite
                    ctx.lineTo(px + s - 10, py + s - 10); // vers bas
                    ctx.lineTo(px, py + s - 10)
                    ctx.lineTo(px, py + 10)
                    ctx.lineTo(px + 10, py + 10)
                } else if ((a === "down" && b === "right") || (a === "right" && b === "down")) {
                    ctx.lineTo(px + s, py + 10)
                    ctx.lineTo(px+s, py + s -10)
                    ctx.lineTo(px+s-10, py + s -10)
                    ctx.lineTo(px+s-10, py + s)
                    ctx.lineTo(px+10, py+s)
                } else if ((a === "down" && b === "left") || (a === "left" && b === "down")) {
                    ctx.lineTo(px+s-10, py+10)
                    ctx.lineTo(px+s-10, py + s)
                    ctx.lineTo(px+10, py+s)
                    ctx.lineTo(px+10, py+s-10)
                    ctx.lineTo(px, py+s-10)
                    ctx.lineTo(px, py+10)
                }
                ctx.closePath();
                ctx.fill();
            }
        } else if (neighbors.length === 1) {
        if (neighbors.includes("left")) {
            ctx.fillRect(px, py+10, s-10, s-20);
        } else if (neighbors.includes("right")) {
            ctx.fillRect(px+10, py+10, s-10, s-20)
        } else if (neighbors.includes("up")) {
            ctx.fillRect(px+10, py, s-20, s-10)
        } else if (neighbors.includes("down")) {
            ctx.fillRect(px+10, py+10, s-20, s-10)
        }
    } else {
            // Convoyeur isolé ou en bout → simple carré
            ctx.fillRect(px + 10, py + 10, s - 20, s - 20);
        }
        
        
        // =========================
        // Flèche avec queue
        // =========================
        const arrowSize = 5;
        const tailLength = 12;
        ctx.fillStyle = "black";
        
        let fx = px;
        let fy = py;
        const mid = s / 2;
        
        if (neighbors.length === 2) {
            const [a, b] = neighbors;
            // L haut-droite
            if ((a === "up" && b === "right") || (a === "right" && b === "up")) {
                if (c.direction === "up") {
                    fx = px + mid;
                    fy = py + arrowSize;
                    // queue vers bas
                    ctx.fillRect(fx - 1, fy, 2, tailLength);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy + arrowSize);
                    ctx.lineTo(fx + arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                } else if (c.direction === "right") {
                    fx = px + s - arrowSize;
                    fy = py + mid;
                    ctx.fillRect(fx - tailLength, fy - 1, tailLength, 2);
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy - arrowSize);
                    ctx.lineTo(fx - arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                }
                return
            }
            if ((a === "up" && b === "left") || (a === "left" && b === "up")) {
                if (c.direction === "up") {
                    fx = px + mid;
                    fy = py + arrowSize;
                    // queue vers bas
                    ctx.fillRect(fx - 1, fy, 2, tailLength);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy + arrowSize);
                    ctx.lineTo(fx + arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                } else if (c.direction === "left") {
                    fx = px + arrowSize;
                    fy = py + mid;
                    // queue horizontale vers droite
                    ctx.fillRect(fx, fy - 1, tailLength, 2);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx + arrowSize, fy - arrowSize);
                    ctx.lineTo(fx + arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                }
                return
            }
            if ((a === "down" && b === "right") || (a === "right" && b === "down")) {
                if (c.direction === "down") {
                    fx = px + mid;
                    fy = py + s - arrowSize;
                    // queue vers haut
                    ctx.fillRect(fx - 1, fy - tailLength, 2, tailLength);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy - arrowSize);
                    ctx.lineTo(fx + arrowSize, fy - arrowSize);
                    ctx.closePath();
                    ctx.fill();
                } else if (c.direction === "right") {
                    fx = px + s - arrowSize;
                    fy = py + mid;
                    // queue horizontale vers gauche
                    ctx.fillRect(fx - tailLength, fy - 1, tailLength, 2);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy - arrowSize);
                    ctx.lineTo(fx - arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                }
                return
            }

            if ((a === "down" && b === "left") || (a === "left" && b === "down")) {
                if (c.direction === "down") {
                    fx = px + mid;
                    fy = py + s - arrowSize;
                    // queue vers haut
                    ctx.fillRect(fx - 1, fy - tailLength, 2, tailLength);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx - arrowSize, fy - arrowSize);
                    ctx.lineTo(fx + arrowSize, fy - arrowSize);
                    ctx.closePath();
                    ctx.fill();
                } else if (c.direction === "left") {
                    fx = px + arrowSize;
                    fy = py + mid;
                    // queue horizontale vers droite
                    ctx.fillRect(fx, fy - 1, tailLength, 2);
                    // pointe
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx + arrowSize, fy - arrowSize);
                    ctx.lineTo(fx + arrowSize, fy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                }
                return
            }
        }
            // lignes droites ou isolé
            const cx = px + mid;
            const cy = py + mid;
            switch(c.direction) {
                case "up":
                    ctx.fillRect(cx - 1, cy, 2, tailLength);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - tailLength);
                    ctx.lineTo(cx - arrowSize, cy - tailLength + arrowSize);
                    ctx.lineTo(cx + arrowSize, cy - tailLength + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case "down":
                    ctx.fillRect(cx - 1, cy - tailLength, 2, tailLength);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + tailLength);
                    ctx.lineTo(cx - arrowSize, cy + tailLength - arrowSize);
                    ctx.lineTo(cx + arrowSize, cy + tailLength - arrowSize);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case "left":
                    ctx.fillRect(cx, cy - 1, tailLength, 2);
                    ctx.beginPath();
                    ctx.moveTo(cx - tailLength, cy);
                    ctx.lineTo(cx - tailLength + arrowSize, cy - arrowSize);
                    ctx.lineTo(cx - tailLength + arrowSize, cy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case "right":
                    ctx.fillRect(cx - tailLength, cy - 1, tailLength, 2);
                    ctx.beginPath();
                    ctx.moveTo(cx + tailLength, cy);
                    ctx.lineTo(cx + tailLength - arrowSize, cy - arrowSize);
                    ctx.lineTo(cx + tailLength - arrowSize, cy + arrowSize);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        
    });
}




/* ========================= */
/*  COFFRES DE RESOURCES   */
/* ========================= */

function drawStorages(ctx: CanvasRenderingContext2D, world: World) {
    world.storages.forEach(s => {
        ctx.fillStyle = colors.machine.logistics;
        ctx.fillRect(s.x*CELL_SIZE+2, s.y*CELL_SIZE+2, CELL_SIZE-4, CELL_SIZE-4);
        
        // Affichage quantité
        ctx.fillStyle = colors.text.primary;
        ctx.font = "12px sans-serif";
        ctx.fillText(
          Object.entries(s.stored).map(([type, qty]) => `${type[0] === "i" ? "🪨":type[0]}:${qty}`).join(" "),
          s.x*CELL_SIZE+2,
          s.y*CELL_SIZE+(CELL_SIZE/2)
        );
    });
}

/* ========================= */
/*  PREVIEW CONVOYEURS       */
/* ========================= */

export function drawPreviewConveyor(ctx: CanvasRenderingContext2D, x: number, y: number, direction: DirectionType) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    ctx.fillStyle = "green";
    ctx.fillRect(px + 10, py + 10, CELL_SIZE - 20,CELL_SIZE - 20)
    drawPreviewArrow(ctx, px + 10, py + 10, CELL_SIZE - 20, direction);
}

function drawPreviewArrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: DirectionType) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const arrowSize = 6; // Taille de la pointe
    const tailLength = 12; // Longueur de la queue
    console.log(x, y, centerX, centerY);
    
    ctx.fillStyle = "black";
    
    switch (direction) {
        case "up":
            // queue
            ctx.fillRect(centerX - 1, centerY - tailLength / 2, 2, tailLength / 2);
            // pointe
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - tailLength / 2 - arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY - tailLength / 2);
            ctx.lineTo(centerX + arrowSize, centerY - tailLength / 2);
            ctx.closePath();
            ctx.fill();
            break;
        
        case "down":
            ctx.fillRect(centerX - 1, centerY, 2, tailLength / 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + tailLength / 2 + arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY + tailLength / 2);
            ctx.lineTo(centerX + arrowSize, centerY + tailLength / 2);
            ctx.closePath();
            ctx.fill();
            break;
        
        case "left":
            ctx.fillRect(centerX - tailLength / 2, centerY - 1, tailLength / 2, 2);
            ctx.beginPath();
            ctx.moveTo(centerX - tailLength / 2 - arrowSize, centerY);
            ctx.lineTo(centerX - tailLength / 2, centerY - arrowSize);
            ctx.lineTo(centerX - tailLength / 2, centerY + arrowSize);
            ctx.closePath();
            ctx.fill();
            break;
        
        case "right":
            ctx.fillRect(centerX, centerY - 1, tailLength / 2, 2);
            ctx.beginPath();
            ctx.moveTo(centerX + tailLength / 2 + arrowSize, centerY);
            ctx.lineTo(centerX + tailLength / 2, centerY - arrowSize);
            ctx.lineTo(centerX + tailLength / 2, centerY + arrowSize);
            ctx.closePath();
            ctx.fill();
            break;
    }
}


/* ========================= */
/*  UTILS POUR CONVOYEURS    */
/* ========================= */

function getNeighborDirections(x: number, y: number, world: World) {
    const neighbors: DirectionType[] = [];
    const {conveyors, storages, machines} = world;
    
    const checkUp = (i) => i.x === x && i.y === y - 1;
    const checkDown = (i) => i.x === x && i.y === y + 1;
    const checkLeft = (i) => i.x === x-1 && i.y === y;
    const checkRight = (i) => i.x === x+1 && i.y === y;
    
    if (conveyors.some(checkUp) || machines.some(checkUp) || storages.some(checkUp)) neighbors.push("up");
    if (conveyors.some(checkDown) || machines.some(checkDown) || storages.some(checkDown)) neighbors.push("down");
    if (conveyors.some(checkLeft) || machines.some(checkLeft) || storages.some(checkLeft)) neighbors.push("left");
    if (conveyors.some(checkRight) || machines.some(checkRight) || storages.some(checkRight)) neighbors.push("right");
    
    
    return neighbors;
}


/* ========================= */
/* RESSOURCES SUR CONVOYEURS */
/* ========================= */
function drawResources(ctx: CanvasRenderingContext2D, world: World) {
    const resourceColors: Record<ResourcesType, string> = {
        iron: colors.resource.iron,
        coal: colors.resource.coal,
        water: colors.resource.water
    }
    
    world.conveyors.forEach(c => {
        if (!c.carrying) return;
        
        const { type, amount, progress = 0 } = c.carrying;
        
        // Position de base au centre de la case
        let px = c.x * CELL_SIZE + CELL_SIZE / 2;
        let py = c.y * CELL_SIZE + CELL_SIZE / 2;
        
        // Calcul du déplacement selon la direction et la progression
        const moveDist = progress * CELL_SIZE;
        const MAX_LEFT = c.x * CELL_SIZE + 20;
        const MAX_RIGHT = c.x * CELL_SIZE + CELL_SIZE + 20;
        const MAX_UP = c.y * CELL_SIZE + 20;
        const MAX_DOWN = c.y * CELL_SIZE + CELL_SIZE + 20;
        switch(c.direction) {
            case "up":    py = Math.min(MAX_UP, py - moveDist); break;
            case "down":  py = Math.min(MAX_DOWN, py + moveDist); break;
            case "left":  px = Math.min(MAX_LEFT, px - moveDist); break;
            case "right": px = Math.min(MAX_RIGHT, px + moveDist); break;
        }
        
        // Dessin de la ressource
        ctx.fillStyle = resourceColors[type];
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}