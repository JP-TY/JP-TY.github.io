# TY.STELLAR — JP-TY.github.io

An ASCII-rendered 3D solar system developer portfolio for James Gabriel Elijah Ty. Fly an ASCII rocket, dock on planets, read the CV.

Custom domain: **jpty.me** (see `CNAME` / `public/CNAME`).

## Stack

- Vite + vanilla TypeScript
- three.js rendered through a custom GPU ASCII post-processing shader (VT323 glyph atlas)
- anime.js v4 for panel choreography
- WebAudio bleeps (off by default)

## Features

- Boot sequence (sessionStorage-skipped, skippable)
- Physics rocket cursor: spring chase, velocity banking, pooled exhaust glyphs
- Autopilot bezier docking onto planets and project moons
- Real DOM content panels sourced from a single `src/data/content.ts`
- Full a11y: reduced motion, keyboard (1–6 dock, ESC undock), touch, skip link, classic scrolling mode, noscript + WebGL-unsupported fallbacks

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
node scripts/qa.mjs  # Playwright visual QA (requires dev server on :5173)
```

Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
