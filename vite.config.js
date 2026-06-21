import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: { host: true, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
})
