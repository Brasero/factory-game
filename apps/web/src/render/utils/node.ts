import {assetManager} from "@web/render/manager/AssetManager.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import type {Grid} from "@engine/world/Grid.ts";

const CELL_SIZE = gridConfig.CELL_SIZE
export function drawResourceNodes(
  ctx: CanvasRenderingContext2D,
  grid: Grid
) {
  if (!grid) return;
  const resourceMap = grid.getResourceMap();
  resourceMap.forEach(node => {
    let img: HTMLImageElement;
    switch (node.resource) {
      case "iron":
        img = assetManager.getImage("node.iron");
        break;
      case "coal":
        img = assetManager.getImage("node.coal");
        break;
      case "water":
        img = assetManager.getImage("node.water");
        break;
    }
    ctx.drawImage(
      img,
      node.pos.x * CELL_SIZE,
      node.pos.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    )
  })
}