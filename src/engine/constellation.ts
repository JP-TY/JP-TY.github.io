/**
 * Constellation: the skill map rendered the way the boot hole is made.
 * Hexagon outlines, Lucide glyphs, and the JTY monogram are all constructed
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
const MW = 920
const MH = 600

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

function iconSVG(icon: unknown, size: number): string {
  const kids = Array.isArray(icon) ? (icon as Kid[]) : []
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${serializeKids(kids)}</svg>`
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
}

async function rasterizeIcon(icon: unknown, size: number): Promise<Raster | null> {
  const img = await loadImage(`data:image/svg+xml;utf8,${encodeURIComponent(iconSVG(icon, size))}`)
  if (!img) return null
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(img, 0, 0, size, size)
  return { data: g.getImageData(0, 0, size, size).data, w: size, h: size }
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
  return { data: g.getImageData(0, 0, w, h).data, w, h }
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
  art: { icon: unknown } | { text: string }
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
  const ready = (async () => {
    await Promise.all(
      model.nodes.map(async (n) => {
        const box = n.kind === 'core' ? 0 : n.kind === 'branch' ? 34 : 24
        const r =
          'text' in n.art
            ? await rasterizeText(n.art.text, 64, 28, 21)
            : await rasterizeIcon(n.art.icon, box)
        if (r) rasters.set(n, r)
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
      // glyph, quantized through the same animated threshold
      const r = rasters.get(n)
      if (r) {
        const ox = cx - r.w / 2
        const oy = cy - r.h / 2
        for (let gy = 0; gy < r.h; gy += 1) {
          for (let gx = 0; gx < r.w; gx += 1) {
            const a = r.data[(gy * r.w + gx) * 4 + 3] / 255
            if (a < 0.05) continue
            const thr = (BAYER[(gy % 4) * 4 + (gx % 4)] / 16) * 0.6 + 0.1 * Math.sin(ts * 2.5 + gx * 0.5 + gy * 0.4)
            if (a < thr) continue
            const s = 1 + a * 1.1
            dot(ox + gx, oy + gy, s, a > 0.7, (live ? 1 : 0.45) * Math.min(1, a + 0.15))
          }
        }
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
