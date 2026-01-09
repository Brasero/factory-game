import {imagePath} from "@web/config/assets.registry.ts";
type AssetKey = string;

class AssetManager {
  private images = new Map<AssetKey, HTMLImageElement>()
  private loaded = false;
  
  async loadAll(registry: Record<string, any>): Promise<void> {
    const entries = this.flattenRegistry(registry);
    
    await Promise.all(
      entries.map(({key, src}) => this.loadImage(key, src))
    )
    this.loaded = true;
  }
  
  getImage(key: AssetKey): HTMLImageElement {
    if (!this.loaded) {
      throw new Error("Assets not loaded yet !")
    }
    const img = this.images.get(key);
    
    if (!img) {
      throw new Error(`Missing assets: ${key}`)
    }
    return img
  }
  
  private loadImage(key: AssetKey, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.images.set(key, img)
        resolve()
      }
      img.onerror = reject
    })
  }
  
  flattenRegistry(obj: Record<string, any>, prefix = ""): {key: string, src: string}[] {
    return Object.entries(obj).flatMap(([k, v]) => {
      const currentKey = prefix ? `${prefix}.${k}` : k;
      
      if (typeof v === "string"){
        return [{key: currentKey, src: v}];
      }
      
      return this.flattenRegistry(v, currentKey);
    })
  }
}

export const assetManager = new AssetManager()

export async function loadGameAssets() {
  await assetManager.loadAll(imagePath)
}