import {assetManager} from "@web/render/manager/AssetManager.ts";
import {config as gridConfig} from "@web/config/gridConfig.ts";
import type {GridSnapshot} from "@engine/api/types.ts";

const CELL_SIZE = gridConfig.CELL_SIZE
export function drawResourceNodes(
  ctx: CanvasRenderingContext2D,
  grid: GridSnapshot
) {
  if (!grid) return;
  grid.resources.forEach(node => {
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
    const subSize = CELL_SIZE / 2
    for (let i = 0; i < 4; i++) {
      const sx = i%2
      const sy = Math.floor(i / 2)
      ctx.drawImage(
        img,
        0,
        0,
        CELL_SIZE,
        CELL_SIZE,
        node.pos.x * CELL_SIZE + sx * subSize,
        node.pos.y * CELL_SIZE + sy * subSize,
        subSize,
        subSize
      )
    }
    // ctx.drawImage(
    //   img,
    //   node.pos.x * CELL_SIZE,
    //   node.pos.y * CELL_SIZE,
    //   CELL_SIZE,
    //   CELL_SIZE
    // )
  })
}