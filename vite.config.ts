import { defineConfig } from 'vite'

// User site served at root (jpty.me / JP-TY.github.io), so base stays '/'.
export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
