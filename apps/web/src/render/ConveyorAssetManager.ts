import {imagePath} from "@web/config/assetsConfig.ts";
import type {DirectionType} from "@engine/models/Conveyor.ts";

export type SpriteKey = DirectionType | `${DirectionType}-${DirectionType}`
class ConveyorAssetManager {
  private images  = new Map<SpriteKey, HTMLImageElement>();
  private loaded = false;
  
  async loadAll(): Promise<void> {
    const entries = Object.entries(imagePath.conveyor) as [SpriteKey, string][];
    await Promise.all(
      entries.map(([key, src]) => this.loadImage(key, src))
    )
    
    this.loaded = true
  }
  
  private loadImage(key: SpriteKey, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.images.set(key, img);
        resolve();
      }
      img.onerror = reject;
    })
  }
  
  getImage(key: SpriteKey): HTMLImageElement {
    if (!this.loaded) {
      throw new Error("Assets not loaded yet")
    }
    
    const img = this.images.get(key);
    if (!img) {
      throw new Error(`Missing conveyor asset: ${key}`)
    }
    return img;
  }
}

export const conveyorAssetManager = new ConveyorAssetManager();