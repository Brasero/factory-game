import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Les chemins relatifs sont indispensables lorsque le renderer est chargé via file:// dans Electron.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': '/packages/engine',
      '@web': '/apps/web/src',
    }
  }
})
