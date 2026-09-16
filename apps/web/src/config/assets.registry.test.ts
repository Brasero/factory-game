import {readFileSync, readdirSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {expect, it} from "vitest";
import {imagePath} from "./assets.registry";

const configDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(configDir, "assets.registry.ts"), "utf8");
const imports = [...source.matchAll(/^import \w+ from "(.+\.png)";$/gm)].map(match => match[1]);
const flatten = (tree: object): string[] => Object.values(tree).flatMap(value =>
  typeof value === "string" ? [value] : flatten(value));

// Comparaison segment par segment : macOS et Vite tolèrent une casse fausse, Linux non.
function existsWithExactCase(path: string): boolean {
  let dir = configDir;
  for (const segment of path.split("/")) {
    if (segment === "..") { dir = dirname(dir); continue; }
    if (!readdirSync(dir).includes(segment)) return false;
    dir = resolve(dir, segment);
  }
  return true;
}

it("loads every registry image through a Vite import so the build ships it", () => {
  expect(imports.length).toBeGreaterThan(0);
  expect(flatten(imagePath)).toHaveLength(imports.length);
  expect(source).not.toMatch(/["'`]\/apps\/web\/src\/assets/);
});

it("references each image with the exact file name case", () => {
  expect(existsWithExactCase("../assets/machines/Water_Pump_running.png")).toBe(false);
  expect(imports.filter(path => !existsWithExactCase(path))).toEqual([]);
});
