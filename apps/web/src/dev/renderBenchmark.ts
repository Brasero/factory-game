import {drawTileMap, drawDecorationTiles} from "@web/render/utils/tiles";
import {visibleCells} from "@web/render/utils/viewport";
import {render} from "@web/render/CanvasRenderer";
import {loadGameAssets} from "@web/render/manager/AssetManager";
import {GameEngine} from "@engine/core/GameEngine";
import {createBenchmarkWorld} from "@engine/test/createBenchmarkWorld";

// Development entry only. Frame intervals are not GPU execution timings.
const canvas = document.querySelector("canvas")!;
const output = document.querySelector("pre")!;
const ctx = canvas.getContext("2d")!;
const report: unknown[] = [];
const log = (value: unknown) => { report.push(value); output.textContent += JSON.stringify(value, null, 2) + "\n"; };
const heap = () => (performance as Performance & {memory?: {usedJSHeapSize: number}}).memory?.usedJSHeapSize ?? null;
const timed = <T>(fn: () => T): [T, number] => { const start = performance.now(); const value = fn(); return [value, performance.now() - start]; };
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {median: sorted[Math.ceil(sorted.length / 2) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1]};
};
let interrupted = document.hidden;
document.addEventListener("visibilitychange", () => { if (document.hidden) interrupted = true; });
log({browser: navigator.userAgent, viewport: [canvas.width, canvas.height], devicePixelRatio,
  samples: 50, warmup: 10, heapMetric: "Approximate JS heap; excludes GPU, GC uncontrolled; null when unavailable",
  gpuMs: null, gpuNote: "Canvas 2D does not expose an isolated GPU timer here"});
try {
  const start = performance.now();
  await loadGameAssets();
  log({assetLoadMs: performance.now() - start, note: "Browser cache state is uncontrolled"});
  // Separate readback canvases: never force GPU readback on the timed render canvas.
  const referenceGrid = new GameEngine(createBenchmarkWorld(100)).getSnapshot().grid!;
  const pixelChecks = [];
  for (const scale of [0.5, 0.75, 1, 2]) {
    for (const offset of [0, -33.5, 47]) {
      const pixels = [false, true].map(repeat => {
        const surface = document.createElement("canvas"); surface.width = 320; surface.height = 240;
        const context = surface.getContext("2d")!;
        context.translate(offset, offset); context.scale(scale, scale);
        const bounds = visibleCells(320, 240, 32, {x: offset, y: offset, scale}, 250, 190);
        drawTileMap(context, referenceGrid, bounds, repeat);
        drawDecorationTiles(context, referenceGrid, bounds);
        return context.getImageData(0, 0, 320, 240).data;
      });
      const equal = pixels[0].every((value, index) => value === pixels[1][index]);
      pixelChecks.push({scale, offset, equal});
    }
  }
  log({pixelChecks});
  if (pixelChecks.some(check => !check.equal)) throw new Error("Water pattern differs from reference rendering");
  for (const count of [100, 1000, 5000]) {
    const heapBefore = heap();
    const [world, sceneCreationMs] = timed(() => createBenchmarkWorld(count));
    const [engine, engineCopyMs] = timed(() => new GameEngine(world));
    const [initial, firstSnapshotMs] = timed(() => engine.getSnapshot());
    log({count, machines: initial.machines.length, storages: initial.storages.length,
      sceneCreationMs, engineCopyMs, firstSnapshotMs, heapBefore, heapAfterSetup: heap()});
    for (const scale of [0.5, 1, 2]) {
      const cpu: number[] = [], frames: number[] = [], simulation: number[] = [], snapshots: number[] = [];
      const layers: Record<string, number[]> = {};
      let previous: number | undefined;
      for (let i = 0; i < 60; i++) {
        const timestamp = await new Promise<number>(resolve => requestAnimationFrame(resolve));
        const [, tickMs] = timed(() => engine.tick());
        const [snapshot, snapshotMs] = timed(() => engine.getSnapshot());
        const [, renderMs] = timed(() => render(ctx, snapshot, {x: -(i % 20) * 8, y: 0, scale, minScale: 0.5, maxScale: 2.5}, undefined, undefined, (name, ms) => {
          if (i >= 10) (layers[name] ??= []).push(ms);
        }));
        if (i >= 10) {
          cpu.push(renderMs); simulation.push(tickMs); snapshots.push(snapshotMs);
          frames.push(timestamp - previous!);
        }
        previous = timestamp;
      }
      log({count, scale, cpuRenderMs: stats(cpu), simulationMs: stats(simulation), snapshotMs: stats(snapshots),
        layersMs: Object.fromEntries(Object.entries(layers).map(([name, values]) => [name, stats(values)])),
        frameIntervalMs: stats(frames), heapAfter: heap(), validForegroundRun: !interrupted});
    }
  }
  log({status: "Terminé", validForegroundRun: !interrupted});
  const button = document.querySelector<HTMLButtonElement>("button")!;
  button.disabled = false;
  button.onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {type: "application/json"}));
    const link = document.createElement("a"); link.href = url; link.download = "factstories-benchmark.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
} catch (error) {
  log({status: "Échec", error: String(error)});
}
