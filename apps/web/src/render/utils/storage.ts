import {config as GridConfig} from "@web/config/gridConfig.ts";
import {colors} from "@web/theme/colors.ts";
import type {Storage} from "@engine/models/Storage.ts";
import type {ResourcesType} from "@engine/models/Resources.ts";
import {assetManager} from "@web/render/manager/AssetManager.ts";
import type {World} from "@engine/models/World.ts";


const resourceIcon: Record<ResourcesType, string> = {
  iron: "ore.ironOre",
  coal: "ore.coalOre",
  water: "ore.waterOre"
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
export function drawStorages(ctx: CanvasRenderingContext2D, world: World) {
  world.storages.forEach(s => {
    const spriteKey = "storage.crate";
    const sprite = assetManager.getImage(spriteKey);
    if (!sprite) return;
    const x = s.x * CELL_SIZE;
    const y = s.y * CELL_SIZE;
    
    ctx.drawImage(
      sprite,
      0, 0,
      CRATE_SPRITE_SIZE, CRATE_SPRITE_SIZE,
      x, y,
      CELL_SIZE, CELL_SIZE
    )
  });
}