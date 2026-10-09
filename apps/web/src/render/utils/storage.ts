import {config as GridConfig} from "@web/config/gridConfig.ts";
import {colors} from "@web/theme/colors.ts";
import type {Storage, ResourcesType, WorldSnapshot} from "@engine/api/types.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";


const resourceIcon: Record<ResourcesType, string> = {
  iron: "ore.ironOre",
  coal: "ore.coalOre",
  water: "ore.waterOre",
  ironPlate: "ore.ironPlate",
  steel: "ore.steel",
  copper: "ore.copperOre",
  copperWire: "ore.copperWire",
  circuit: "ore.circuit",
  uranium: "ore.uraniumOre",
  uraniumCell: "ore.uraniumCell",
  processingUnit: "ore.processingUnit",
  automationCore: "ore.automationCore"
}
const CELL_SIZE = GridConfig.CELL_SIZE
export function drawStorageTooltip(
  ctx: CanvasRenderingContext2D,
  storage: Storage
) {
  const entries = Object.entries(storage.stored).filter(([, v]) => v > 0);
  
  if (entries.length === 0) return;
  
  const baseX = storage.x * CELL_SIZE + CELL_SIZE + 6;
  const baseY = storage.y * CELL_SIZE;
  
  const padding = 6;
  const lineHeight = 32;
  const width= 110;
  const height = padding * 2 + entries.length * lineHeight;
  
  // Fond
  ctx.fillStyle = colors.ui.background;
  ctx.fillRect(baseX, baseY, width, height);
  
  // Bordure
  ctx.strokeStyle = colors.ui.border;
  ctx.strokeRect(baseX, baseY, width, height);
  
  // Texte
  ctx.fillStyle = colors.text.primary;
  ctx.font = "12px monospace";
  
  entries.forEach(([type, amount], i) => {
    const y = baseY + padding + i * lineHeight;
    const icon = assetManager.getImage(resourceIcon[type as ResourcesType]);
    if (icon) {
      ctx.drawImage(
        icon,
        baseX + padding, y,
        32, 32
      )
    }
    ctx.fillText(
      `x${amount}`,
      baseX + padding + 32 + 6,
      y + 32 / 2
    )
  })
}

const CRATE_SPRITE_SIZE = 16
export function drawStorages(ctx: CanvasRenderingContext2D, world: WorldSnapshot) {
  world.storages.forEach(s => drawStorageAt(ctx, s));
}

export function drawStorageAt(ctx: CanvasRenderingContext2D, storage: Storage) {
  const spriteKey = "storage.crate";
  const sprite = assetManager.getImage(spriteKey);
  if (!sprite) return;
  const x = storage.x * CELL_SIZE;
  const y = storage.y * CELL_SIZE;
  
  ctx.drawImage(
    sprite,
    0, 0,
    CRATE_SPRITE_SIZE, CRATE_SPRITE_SIZE,
    x, y,
    CELL_SIZE, CELL_SIZE
  )
  if (storage.kind === "shipping-depot") {
    ctx.save();
    ctx.strokeStyle = storage.contractId ? "#79e8c2" : "#65dfff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.fillStyle = "#0c2733";
    ctx.fillRect(x + CELL_SIZE / 2, y, CELL_SIZE / 2, CELL_SIZE / 2);
    ctx.fillStyle = "#65dfff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(storage.depotNumber ?? "?"), x + CELL_SIZE * .75, y + CELL_SIZE / 4, CELL_SIZE / 2 - 2);
    ctx.restore();
  }

}
