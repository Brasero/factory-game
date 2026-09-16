import {defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {alias: {
    "@engine": fileURLToPath(new URL("./packages/engine", import.meta.url)),
    "@web": fileURLToPath(new URL("./apps/web/src", import.meta.url))
  }},
  test: {
    environment: "node",
    include: ["packages/engine/**/*.test.ts", "apps/web/src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true
  }
});
