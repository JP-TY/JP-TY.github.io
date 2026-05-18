import { defineConfig } from 'vite'

// Served at https://jpty.github.io/ (user site = root), so base stays '/'.
export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
