import {it} from "vitest";
import {performance} from "node:perf_hooks";
import {GameEngine} from "./GameEngine";
import {createTestWorld} from "@engine/test/createTestWorld";
import type {Conveyor} from "@engine/models/Conveyor";
import {Grid} from "@engine/world/Grid";
import {TileMap} from "@engine/world/TileMap";
import {createBenchmarkWorld} from "@engine/test/createBenchmarkWorld";

it.skipIf(!process.env.PERF)("reports reproducible simulation and snapshot timings", () => {
  const measure = (fn: () => void) => {
    const samples: number[] = [];
    for (let i = 0; i < 60; i++) {
      const start = performance.now(); fn();
      if (i >= 10) samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return {median: +samples[25].toFixed(3), p95: +samples[47].toFixed(3)};
  };
  for (const count of [100, 1000, 5000]) {
    for (const loaded of [false, true]) {
      const world = createTestWorld();
      const tiles = Array.from({length: 190}, () => Array.from({length: 250}, () => ({biome: "grass" as const, variant: 0})));
      world.grid = new Grid(250, 190, new TileMap(250, 190, tiles));
      world.conveyors = Array.from({length: count}, (_, i): Conveyor => ({
        id: String(i), x: i % 250, y: Math.floor(i / 250), type: "conveyor", entityType: "conveyor",
        direction: "right", capacity: 3, speed: 0.2,
        carrying: loaded ? [{type: "iron", amount: 1, progress: 0.5}] : []
      }));
      const engine = new GameEngine(world);
      console.log(JSON.stringify({count, loaded, simulationMs: measure(() => engine.tick()),
        snapshotMs: measure(() => { engine.getSnapshot(); })}));
    }
  }
});

it.skipIf(!process.env.PERF)("reports bulk destruction timings", () => {
  const run = (count: number, mode: "sequential" | "sequential-snapshots" | "batch") => {
    const world = createBenchmarkWorld(count);
    const positions = world.conveyors.map(({x, y}) => ({x, y}));
    const engine = new GameEngine(world);
    const start = performance.now();
    if (mode === "batch") {
      if (!engine.destroyEntitiesAt(positions)) throw new Error("La suppression groupée n’a rien supprimé");
      engine.getSnapshot();
    } else {
      let removed = 0;
      for (const position of positions) {
        if (engine.destroyEntityAt(position.x, position.y)) removed++;
        if (mode === "sequential-snapshots") engine.getSnapshot();
      }
      if (removed !== count) throw new Error(`Suppression incomplète : ${removed}/${count}`);
    }
    const duration = performance.now() - start;
    if (engine.getSnapshot().conveyors.length !== 0) throw new Error("Suppression incomplète");
    return duration;
  };

  for (const count of [100, 1000, 5000]) {
    for (const mode of ["sequential", "sequential-snapshots", "batch"] as const) {
      const samples = Array.from({length: 3}, () => run(count, mode)).sort((a, b) => a - b);
      const median = samples[1];
      console.log(JSON.stringify({count, mode,
        totalMs: +median.toFixed(3), perEntityMs: +(median / count).toFixed(4)}));
    }
  }
}, 20_000);
