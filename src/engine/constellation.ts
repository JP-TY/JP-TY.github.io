/**
 * Constellation: the skill map rendered the way the boot hole is made.
 * Hexagon outlines, Lucide glyphs, brand marks, and the portrait medallion
 * are all constructed
 * from animated dot-matrix dither quantized through a time-jittered Bayer
 * threshold, with traveling pulses on the core traces. DOM buttons stay on
 * top as transparent hit-areas (click, keyboard, focus); the canvas is pure
 * visual chrome. ~30fps throttle, static single frame under reduced motion.
 */

const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]
// Model space: hand-spaced layout coordinates. The canvas maps these onto
// whatever the container measures; node sizes stay in device pixels so the
// drawn hexes always match their DOM hit-areas exactly.
const MW = 1440
const MH = 900

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >> 13)) | 0
  h = (h * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

type Kid = [string, Record<string, string | number>, Kid[]?]

function serializeKids(kids: Kid[]): string {
  return kids
    .map(([tag, attrs, children]) => {
      const a = Object.entries(attrs ?? {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      const inner = children && children.length ? serializeKids(children) : ''
      return inner ? `<${tag} ${a}>${inner}</${tag}>` : `<${tag} ${a}/>`
    })
    .join('')
}

export function iconSVG(icon: unknown, size: number, stroke = '#fff'): string {
  // Brand marks arrive as raw SVG path data and render filled; lucide
  // glyphs arrive as node arrays and render stroked like before.
  if (typeof icon === 'string') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="${icon}"/></svg>`
  }
  const kids = Array.isArray(icon) ? (icon as Kid[]) : []
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${serializeKids(kids)}</svg>`
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

interface Raster {
  data: Uint8ClampedArray
  w: number
  h: number
  color: boolean
}

export async function rasterizeSVG(svg: string, size: number): Promise<Raster | null> {  const img = await loadImage(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  if (!img) return null
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(img, 0, 0, size, size)
  return { data: g.getImageData(0, 0, size, size).data, w: size, h: size, color: false }
}

/** Photos rasterize cover-fit with luminance folded into alpha so the
 *  animated threshold dithers the image instead of filling a slab.
 *  Icon PNGs (dark-on-transparent) use ink mode: alpha times the
 *  stronger of luminance and darkness, so dark marks survive.
 *  Color mode keeps the source RGB so the portrait reads in full color. */
async function rasterizePhoto(src: string, size: number, ink = false, color = false): Promise<Raster | null> {
  const img = await loadImage(src)
  if (!img || !img.naturalWidth || !img.naturalHeight) return null
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  const s = Math.max(size / img.naturalWidth, size / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  g.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  const data = g.getImageData(0, 0, size, size).data
  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
    const mask = ink ? (data[i + 3] / 255) * Math.max(lum, 1 - lum) : lum
    if (!color) {
      data[i] = 255
      data[i + 1] = 180
      data[i + 2] = 90
      data[i + 3] = Math.round(mask * 255)
    }
  }
  return { data, w: size, h: size, color }
}

/** Paint a photo URL into a canvas as animated amber dot-matrix.
 *  Adds `has-photo` to the wrapping li on first paint; canvases that
 *  fail to load stay blank so the fallback socket shows instead. */
export async function ditherInto(canvas: HTMLCanvasElement, src: string, cells: number): Promise<() => void> {
  const noop = (): void => undefined
  const img = await loadImage(src)
  if (!img || !img.naturalWidth || !img.naturalHeight) return noop
  const ctx = canvas.getContext('2d')
  if (!ctx) return noop
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const off = document.createElement('canvas')
  off.width = cells
  off.height = cells
  const g = off.getContext('2d', { willReadFrequently: true })
  if (!g) return noop
  const s = Math.max(cells / img.naturalWidth, cells / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  g.drawImage(img, (cells - dw) / 2, (cells - dh) / 2, dw, dh)
  const data = g.getImageData(0, 0, cells, cells).data
  const lum: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    lum.push(((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255) * (data[i + 3] / 255))
  }
  // Stretch to full range so dark source art still reads as solid amber.
  let lo = 1
  let hi = 0
  for (const v of lum) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const span = Math.max(0.001, hi - lo)
  for (let i = 0; i < lum.length; i += 1) lum[i] = Math.pow((lum[i] - lo) / span, 1.25)
  const W = canvas.width
  const H = canvas.height
  const cell = W / cells
  const radius = cells / 2
  const draw = (t: number): void => {
    const ts = t / 1000
    ctx.clearRect(0, 0, W, H)
    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        // Circular medallion mask so square source corners never print.
        const dx = x + 0.5 - radius
        const dy = y + 0.5 - radius
        if (dx * dx + dy * dy > radius * radius) continue
        const a = lum[y * cells + x]
        if (a < 0.06) continue
        const tw = 0.85 + 0.15 * Math.sin(ts * 1.8 + x * 0.9 + y * 1.1)
        const thr = (BAYER[(y % 4) * 4 + (x % 4)] / 16) * 0.42
        if (a * tw < thr) continue
        const alpha = Math.min(1, a + 0.4).toFixed(3)
        // Duotone phosphor: hot core highlights, amber body — same
        // pair as the constellation dot() so badges sit in the scene.
        ctx.fillStyle = a > 0.65 ? `rgba(255, 217, 122, ${alpha})` : `rgba(245, 181, 68, ${alpha})`
        const d = Math.max(1.4, cell - 0.5)
        ctx.fillRect(x * cell + (cell - d) / 2, y * cell + (cell - d) / 2, d, d)
      }
    }
  }
  draw(1000)
  canvas.closest('li')?.classList.add('has-photo')
  if (reduced) return noop
  let raf = requestAnimationFrame(function frame(t: number): void {
    draw(t)
    raf = requestAnimationFrame(frame)
  })
  return () => cancelAnimationFrame(raf)
}

export async function rasterizeIcon(icon: unknown, size: number): Promise<Raster | null> {
  return rasterizeSVG(iconSVG(icon, size), size)
}

async function rasterizeText(text: string, w: number, h: number, px: number): Promise<Raster | null> {
  try {
    await document.fonts.ready
  } catch {
    /* fall through with whatever font is available */
  }
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.font = `700 ${px}px "JetBrains Mono", ui-monospace, monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#fff'
  g.fillText(text, w / 2, h / 2 + 1)
  return { data: g.getImageData(0, 0, w, h).data, w, h, color: false }
}

/** Flat-top hexagon vertices matching the old clip-path shape. */
function hexVerts(cx: number, cy: number, w: number, h: number): [number, number][] {
  return [
    [cx - w / 4, cy - h / 2],
    [cx + w / 4, cy - h / 2],
    [cx + w / 2, cy],
    [cx + w / 4, cy + h / 2],
    [cx - w / 4, cy + h / 2],
    [cx - w / 2, cy],
  ]
}

export interface CNode {
  branch: string
  kind: 'core' | 'branch' | 'item'
  x: number
  y: number
  w: number
  h: number
  art: { icon: unknown; box?: number } | { text: string; w?: number; h?: number; px?: number } | { img: string; box?: number; ink?: boolean; color?: boolean }
  caption?: string
}

export interface CTrace {
  x1: number
  y1: number
  x2: number
  y2: number
  major: boolean
}

export interface CModel {
  nodes: CNode[]
  traces: CTrace[]
  isActive: (branch: string) => boolean
  hover: { branch: string | null }
}

export function startConstellation(canvas: HTMLCanvasElement, model: CModel): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let W = 0
  let H = 0
  const resize = () => {
    const parent = canvas.parentElement
    W = Math.max(320, parent?.clientWidth || window.innerWidth)
    H = Math.max(320, parent?.clientHeight || window.innerHeight)
    canvas.width = W
    canvas.height = H
  }
  resize()
  window.addEventListener('resize', resize)
  const X = (x: number): number => (x * W) / MW
  const Y = (y: number): number => (y * H) / MH

  // Rasterize every glyph up front; the loop starts once they land.
  const rasters = new Map<CNode, Raster>()
  const captions = new Map<CNode, Raster>()
  const ready = (async () => {
    await Promise.all(
      model.nodes.map(async (n) => {
        const box =
          n.kind === 'core'
            ? 0
            : 'box' in n.art && typeof n.art.box === 'number'
              ? n.art.box
              : n.kind === 'branch'
                ? 34
                : 24
        const r =
          'img' in n.art
            ? await rasterizePhoto(n.art.img, n.art.box ?? 64, n.art.ink ?? false, n.art.color ?? false)
            : 'text' in n.art
              ? await rasterizeText(n.art.text, n.art.w ?? 64, n.art.h ?? 28, n.art.px ?? 21)
              : typeof n.art.icon === 'string' && n.art.icon.includes('<svg')
                ? await rasterizeSVG(n.art.icon, box)
                : await rasterizeIcon(n.art.icon, box)
        if (r) rasters.set(n, r)
        if (n.caption) {
          const c = await rasterizeText(n.caption, 220, 24, 15)
          if (c) captions.set(n, c)
        }
      }),
    )
  })()

  let raf = 0
  let last = 0

  const dot = (x: number, y: number, s: number, hot: boolean, alpha: number) => {
    ctx.fillStyle = hot
      ? `rgba(255, 196, 107, ${alpha.toFixed(3)})`
      : `rgba(255, 165, 59, ${alpha.toFixed(3)})`
    ctx.fillRect(x - s / 2, y - s / 2, s, s)
  }

  // Point-in-convex-polygon for clipping a blit inside its hexagon.
  const inPoly = (px: number, py: number, v: [number, number][]): boolean => {
    let sign = 0
    for (let i = 0; i < v.length; i += 1) {
      const [ax, ay] = v[i]
      const [bx, by] = v[(i + 1) % v.length]
      const s = Math.sign((bx - ax) * (py - ay) - (by - ay) * (px - ax))
      if (s === 0) continue
      if (sign === 0) sign = s
      else if (s !== sign) return false
    }
    return true
  }

  // Glyph blit quantized through the animated threshold; pass verts to
  // clip the blit inside a polygon (the portrait stays in its hex).
  // Gain thins a blit out — photos get a lower gain so the dot-matrix
  // reads instead of filling a slab.
  const drawRaster = (
    r: Raster,
    ox: number,
    oy: number,
    live: boolean,
    ts: number,
    clip: [number, number][] | null,
    gain = 1,
  ): void => {
    for (let gy = 0; gy < r.h; gy += 1) {
      for (let gx = 0; gx < r.w; gx += 1) {
        const idx = (gy * r.w + gx) * 4
        const a = (r.data[idx + 3] / 255) * gain
        if (a < 0.05) continue
        if (clip && !inPoly(ox + gx, oy + gy, clip)) continue
        const thr = (BAYER[(gy % 4) * 4 + (gx % 4)] / 16) * 0.6 + 0.1 * Math.sin(ts * 2.5 + gx * 0.5 + gy * 0.4)
        if (a < thr) continue
        const s = 1 + a * 1.1
        if (r.color) {
          const alpha = ((live ? 1 : 0.45) * Math.min(1, a + 0.15)).toFixed(3)
          ctx.fillStyle = `rgba(${r.data[idx]}, ${r.data[idx + 1]}, ${r.data[idx + 2]}, ${alpha})`
          ctx.fillRect(ox + gx - s / 2, oy + gy - s / 2, s, s)
          continue
        }
        dot(ox + gx, oy + gy, s, a > 0.7, (live ? 1 : 0.45) * Math.min(1, a + 0.15))
      }
    }
  }

  const draw = (t: number) => {
    const ts = t / 1000
    ctx.clearRect(0, 0, W, H)

    // traces + traveling pulses on the core lines
    for (const tr of model.traces) {
      const x1 = X(tr.x1)
      const y1 = Y(tr.y1)
      const x2 = X(tr.x2)
      const y2 = Y(tr.y2)
      ctx.strokeStyle = tr.major ? 'rgba(255, 165, 59, 0.38)' : 'rgba(255, 165, 59, 0.16)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      if (tr.major && !reduced) {
        for (let k = 0; k < 2; k += 1) {
          const p = (ts * 0.22 + k * 0.5) % 1
          dot(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, 2.4, true, 0.9)
        }
      }
    }

    for (const n of model.nodes) {
      const live = model.isActive(n.branch) || model.hover.branch === n.branch
      const cx = X(n.x)
      const cy = Y(n.y)
      const verts = hexVerts(cx, cy, n.w, n.h)
      // hexagon outline, built dot by dot with animated boil
      for (let e = 0; e < 6; e += 1) {
        const [ax, ay] = verts[e]
        const [bx, by] = verts[(e + 1) % 6]
        const len = Math.hypot(bx - ax, by - ay)
        const steps = Math.max(2, Math.floor(len / 4))
        for (let s = 0; s <= steps; s += 1) {
          const px = ax + ((bx - ax) * s) / steps
          const py = ay + ((by - ay) * s) / steps
          const ix = Math.floor(px / 4)
          const iy = Math.floor(py / 4)
          const shimmer = 0.55 + 0.45 * Math.sin(ts * 2 + ix * 0.7 + iy * 0.9)
          const thr = (BAYER[(iy % 4) * 4 + (ix % 4)] / 16) * 0.6 + 0.12 * Math.sin(ts * 3 + ix)
          const b = (0.45 + 0.55 * hash(ix, iy)) * shimmer
          if (b < thr) continue
          dot(px, py, live ? 2.4 : 1.8, live && b > 0.72, (live ? 0.95 : 0.4) * Math.min(1, b + 0.25))
        }
      }
      // sonar pulse on the selected branch's anchor node
      if (n.kind === 'branch' && live && !reduced) {
        const pr = n.w / 2 + 8 + ((ts * 22) % 26)
        for (let s = 0; s <= 40; s += 1) {
          const pa = (s / 40) * Math.PI * 2
          if (hash(s, 999) < 0.5) continue
          dot(cx + Math.cos(pa) * pr, cy + Math.sin(pa) * pr * 0.87, 1.6, true, Math.max(0, 0.8 - (pr - n.w / 2) / 40))
        }
      }
      // glyph, quantized through the same animated threshold; the
      // portrait medallion is clipped along its hexagon and rendered
      // thinner so the dot-matrix reads
      const r = rasters.get(n)
      if (r) {
        const isPhoto = 'img' in n.art
        const colorful = isPhoto && 'color' in n.art && n.art.color === true
        const gain = !isPhoto ? 1 : 'ink' in n.art && n.art.ink ? 1 : colorful ? 1 : 0.6
        drawRaster(r, cx - r.w / 2, cy - r.h / 2, live, ts, isPhoto ? verts : null, gain)
      }
      // name caption riding below the core medallion
      const cap = captions.get(n)
      if (cap) {
        drawRaster(cap, cx - cap.w / 2, cy + n.h / 2 + 12, live, ts, null)
      }
    }
  }

  if (reduced) {
    void ready.then(() => draw(1200))
    return () => window.removeEventListener('resize', resize)
  }

  let dead = false
  void ready.then(() => {
    if (dead) return
    const frame = (t: number) => {
      if (dead) return
      if (t - last > 33) {
        last = t
        draw(t)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
  })
  return () => {
    dead = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
