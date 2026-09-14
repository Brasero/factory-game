import {render} from "@web/render/CanvasRenderer";
import {loadGameAssets} from "@web/render/manager/AssetManager";
import type {WorldSnapshot} from "@engine/api/types";

// Manual development-only benchmark. No production entrypoint imports this module.
const canvas = document.querySelector("canvas")!;
const output = document.querySelector("pre")!;
const ctx = canvas.getContext("2d")!;
const camera = {x: 0, y: 0, scale: 1, minScale: 0.5, maxScale: 2.5};
await loadGameAssets();
for (const count of [100, 1000, 5000]) {
  const world: WorldSnapshot = {
    tick: 0, machines: [], storages: [], resources: {iron: 0, coal: 0, water: 0},
    grid: {width: 250, height: 190, resources: [], tiles: Array.from({length: 190}, () =>
      Array.from({length: 250}, () => ({biome: "grass", variant: 3})))},
    conveyors: Array.from({length: count}, (_, i) => ({
      id: String(i), x: i % 250, y: Math.floor(i / 250), type: "conveyor", entityType: "conveyor",
      direction: "right", capacity: 3, speed: 0.2, carrying: [{type: "iron", amount: 1, progress: 0.5}]
    }))
  };
  const samples: number[] = [];
  for (let i = 0; i < 60; i++) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    world.tick++;
    const start = performance.now();
    render(ctx, world, camera);
    if (i >= 10) samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  output.textContent += `${count} convoyeurs : médiane ${samples[25].toFixed(3)} ms ; p95 ${samples[47].toFixed(3)} ms\n`;
}
output.textContent += "Terminé. Temps CPU des appels Canvas, hors chargement et exécution GPU.\n";
