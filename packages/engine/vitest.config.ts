import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      '@engine': '/',
      '@web': '../../apps/web/src',
    }
  }
})