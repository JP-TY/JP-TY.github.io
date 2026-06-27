/**
 * Dream: the menu is a living solar system inside the spiral galaxy.
 * A dithered sun burns at the center, anchoring six planets, one per
 * page, turning as a slow carousel: every planet shares one tilt and one
 * angular speed with even phases on wide orbits, so the formation keeps
 * clear space while it moves. Each
 * keeps its own character (bands, a ring, a moon). A spoke links every
 * to the sun; hovering or focusing a menu row ignites its planet, spoke,
 * and label. Planets are clickable portals to their pages. Everything is
 * amber dot-matrix dither in the boot hole's language, with glow halos
 * so planets read as foreground bodies and a targeting reticle locking
 * the selected one. Static single frame under reduced motion (hover
 * still relights). Pure chrome.
 */

const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]
const RUNES = '·:+*x#%@'
const ARMS = 2
const ARM_DOTS = 700
const STARS = 420

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >> 13)) | 0
  h = (h * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

interface Pt {
  x: number
  y: number
}

interface Planet {
  orbit: number
  tilt: number
  speed: number
  phase: number
  size: number
  ring: boolean
  moon: boolean
  bands: boolean
}

// Rotating carousel: one shared tilt and angular speed with even phases,
// so the formation turns as a whole and planets never drift into
// conjunction. Wide even orbits keep clear space; the relax pass below
// is only a safety net that also holds planet centers out of the sun.
const TILT = 0.62
const ORBIT_SPEED = 0.06
const ORBIT_MAX = 0.99
const LARGEST_DISC = 58
const PLANETS: Planet[] = [
  { orbit: 0.34, tilt: TILT, speed: ORBIT_SPEED, phase: 0.4, size: 38, ring: false, moon: false, bands: false },
  { orbit: 0.47, tilt: TILT, speed: ORBIT_SPEED, phase: 1.45, size: 50, ring: false, moon: false, bands: false },
  { orbit: 0.6, tilt: TILT, speed: ORBIT_SPEED, phase: 2.49, size: 36, ring: false, moon: true, bands: false },
  { orbit: 0.73, tilt: TILT, speed: ORBIT_SPEED, phase: 3.54, size: 58, ring: false, moon: false, bands: true },
  { orbit: 0.86, tilt: TILT, speed: ORBIT_SPEED, phase: 4.59, size: 46, ring: true, moon: false, bands: false },
  { orbit: 0.99, tilt: TILT, speed: ORBIT_SPEED, phase: 5.64, size: 32, ring: false, moon: false, bands: false },
]

export function startDream(
  canvas: HTMLCanvasElement,
  hover: { index: number | null },
  labels: string[],
  onSelect: (index: number) => void,
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const count = Math.min(labels.length, PLANETS.length)

  let W = 0
  let H = 0
  const resize = () => {
    const parent = canvas.parentElement
    W = Math.max(320, parent?.clientWidth || window.innerWidth)
    H = Math.max(480, parent?.clientHeight || window.innerHeight)
    canvas.width = W
    canvas.height = H
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0
  let last = 0
  let lastHover: number | null | undefined = undefined
  // Persistent per-planet offsets so separation never pops.
  const offsets: Pt[] = PLANETS.map(() => ({ x: 0, y: 0 }))
  // latest computed centers for click hit-testing
  let centers: Pt[] = []
  // anchored label boxes for hit-testing, refreshed every frame
  let labelBoxes: { x: number; y: number; w: number; align: CanvasTextAlign }[] = []

  const dot = (x: number, y: number, s: number, hot: boolean, alpha: number) => {
    ctx.fillStyle = hot
      ? `rgba(255, 196, 107, ${alpha.toFixed(3)})`
      : `rgba(255, 165, 59, ${alpha.toFixed(3)})`
    ctx.fillRect(x - s / 2, y - s / 2, s, s)
  }

  const planetPos = (i: number, ts: number, cx: number, cy: number, maxR: number): Pt => {
    const p = PLANETS[i]
    const a = p.phase + ts * p.speed
    return {
      x: cx + Math.cos(a) * p.orbit * maxR * 1.15,
      y: cy + Math.sin(a) * p.orbit * maxR * p.tilt,
    }
  }

  // auto-fit: measure the outermost orbit plus the largest disc against
  // both half-axes and scale the whole system (orbits, bodies, tags)
  // down on narrow viewports so nothing ever clips. Wide screens keep
  // scale 1 and render full-size.
  const fitSystem = (): { U: number; maxR: number } => {
    const U0 = Math.min(Math.max(Math.min(W, H) / 800, 0.7), 1.3)
    const maxR0 = Math.min(W, H) * 0.7
    const Rfit = LARGEST_DISC * U0
    const ex = ORBIT_MAX * maxR0 * 1.15 + Rfit
    const ey = ORBIT_MAX * maxR0 * TILT + Rfit
    const scale = Math.max(0.35, Math.min(1, (W / 2 - 16) / ex, (H / 2 - 16) / ey))
    return { U: U0 * scale, maxR: maxR0 * scale }
  }

  const draw = (t: number) => {
    const ts = reduced ? 1.2 : t / 1000
    ctx.clearRect(0, 0, W, H)
    const { U, maxR } = fitSystem()
    const cx = W * 0.5
    const cy = H * 0.5
    const rot = ts * 0.05
    centers = []

    // breathing nebulae
    const neb = 0.85 + 0.15 * Math.sin(ts * 0.4)
    const nebulae: [number, number, number][] = [
      [cx - maxR * 0.7, cy - maxR * 0.5, maxR * 1.5],
      [cx + maxR * 0.6, cy + maxR * 0.55, maxR * 1.3],
    ]
    for (const [nx, ny, nr] of nebulae) {
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr)
      g.addColorStop(0, `rgba(255, 143, 18, ${(0.06 * neb).toFixed(3)})`)
      g.addColorStop(1, 'rgba(255, 143, 18, 0)')
      ctx.fillStyle = g
      ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2)
    }

    // deep starfield
    for (let i = 0; i < STARS; i += 1) {
      const depth = i % 3
      const speed = [0.004, 0.009, 0.018][depth]
      const sx = (hash(i, 7) * W + ts * speed * W * (depth + 1)) % W
      const sy = hash(i, 13) * H
      const tw = 0.5 + 0.5 * Math.sin(ts * (0.8 + depth * 0.5) + i)
      const b = hash(i, 29) * tw
      if (b < 0.48) continue
      dot(sx, sy, depth === 2 ? 2.2 : 1.5, b > 0.9, (b - 0.32) * 1.2)
      // rare foreground sparkle: tiny cross flares on the brightest stars
      if (b > 0.97) {
        dot(sx - 3, sy, 1.4, true, 0.7)
        dot(sx + 3, sy, 1.4, true, 0.7)
        dot(sx, sy - 3, 1.4, true, 0.7)
        dot(sx, sy + 3, 1.4, true, 0.7)
      }
    }

    // spiral arms sprawling corner to corner across the whole page
    const diag = Math.hypot(W, H) / 2
    for (let a = 0; a < ARMS; a += 1) {
      for (let k = 0; k < ARM_DOTS; k += 1) {
        const f = k / ARM_DOTS
        const th = f * Math.PI * 3.6 + (a * Math.PI * 2) / ARMS + rot
        const r = diag * Math.pow(f, 0.85)
        const jx = (hash(k, a * 3 + 1) - 0.5) * diag * 0.16 * (0.3 + f)
        const jy = (hash(k, a * 3 + 2) - 0.5) * diag * 0.16 * (0.3 + f)
        const px = cx + Math.cos(th) * r + jx
        const py = cy + Math.sin(th) * r * 0.62 + jy
        const ix = Math.floor(px / 4)
        const iy = Math.floor(py / 4)
        const shimmer = 0.6 + 0.4 * Math.sin(ts * 1.6 + ix * 0.6 + iy * 0.8 + f * 5)
        const thr = (BAYER[(iy % 4) * 4 + (ix % 4)] / 16) * 0.62 + 0.08 * Math.sin(ts * 2.2 + ix)
        const b = (0.4 + 0.6 * hash(ix, iy)) * shimmer * (1 - f * 0.4) + (1 - f) * 0.24
        if (b < thr) continue
        dot(px, py, 1.8 + f * 1.6, b > 0.8, Math.min(1, b + 0.25) * 0.95)
        // bright knots: stellar nurseries studding the arms
        if (k % 47 === 0) {
          dot(px - 2, py - 1, 2.2, true, 0.85)
          dot(px + 2, py + 1, 2.4, true, 0.9)
          dot(px, py - 3, 1.8, true, 0.7)
        }
      }
    }

    // occasional comet streaking across the sky
    if (!reduced) {
      const cometT = ts % 12
      if (cometT < 1.4) {
        const cp = cometT / 1.4
        const hx = W * (0.95 - cp * 1.15)
        const hy = H * (0.08 + cp * 0.3)
        for (let k = 0; k <= 22; k += 1) {
          const q = k / 22
          dot(hx + q * 90, hy - q * 34, k === 0 ? 3 : 2, k < 4, (1 - q) * 0.9)
        }
      }
    }

    // the sun
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.48)
    core.addColorStop(0, `rgba(255, 205, 120, ${(0.62 + 0.12 * Math.sin(ts * 1.1)).toFixed(3)})`)
    core.addColorStop(1, 'rgba(255, 143, 18, 0)')
    ctx.fillStyle = core
    ctx.fillRect(cx - maxR * 0.48, cy - maxR * 0.48, maxR * 0.96, maxR * 0.96)

    // the sun: a proper dithered star. Boiling granulation disc with
    // dark sunspot umbrae, bright limb, hugging corona rings, rotating
    // flare arcs, a slow instrument tick ring, and a deep halo.
    const sunR = maxR * 0.12
    const sunHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 3.2)
    sunHalo.addColorStop(0, `rgba(255, 190, 90, ${(0.4 + 0.08 * Math.sin(ts * 1.3)).toFixed(3)})`)
    sunHalo.addColorStop(1, 'rgba(255, 143, 18, 0)')
    ctx.fillStyle = sunHalo
    ctx.fillRect(cx - sunR * 3.2, cy - sunR * 3.2, sunR * 6.4, sunR * 6.4)
    {
      const rad = Math.ceil(sunR) + 1
      const spots: [number, number, number][] = [
        [0.3, -0.15, 0.16],
        [-0.35, 0.28, 0.12],
      ]
      for (let gy = -rad; gy <= rad; gy += 1) {
        for (let gx = -rad; gx <= rad; gx += 1) {
          const d = Math.hypot(gx, gy) / sunR
          if (d > 1) continue
          const boil = 0.75 + 0.25 * Math.sin(ts * 3 + gx * 0.35 + gy * 0.5)
          const granule = hash(Math.floor((cx + gx) / 3), Math.floor((cy + gy) / 3))
          let b = (1 - d * 0.25) * boil * (0.7 + 0.3 * granule) + 0.15
          // sunspot umbrae: dark pits with bright penumbra rims
          for (const [sx, sy, sr] of spots) {
            const od = Math.hypot((gx - sx * sunR) / sunR / sr, (gy - sy * sunR) / sunR / sr)
            if (od < 1) b *= 0.2
            else if (od < 1.5) b = Math.max(b, 0.95)
          }
          if (d > 0.88) b = Math.max(b, 1.0)
          const ix = Math.floor((cx + gx) / 3)
          const iy = Math.floor((cy + gy) / 3)
          const thr = (BAYER[(iy % 4) * 4 + (ix % 4)] / 16) * 0.6 + 0.08 * Math.sin(ts * 2.6 + ix)
          if (b < thr) continue
          dot(cx + gx, cy + gy, 1 + b, b > 0.7, Math.min(1, b + 0.25) * 1.2)
        }
      }
    }
    // hugging corona rings
    for (const [rr, skip] of [[1.5, 0.35], [2.0, 0.5]] as const) {
      for (let s = 0; s <= 72; s += 1) {
        const a = (s / 72) * Math.PI * 2
        if (hash(s, 500 + Math.floor(rr * 10)) < skip) continue
        dot(cx + Math.cos(a) * sunR * rr, cy + Math.sin(a) * sunR * rr, 2.2, true, 0.8)
      }
    }
    // rotating flare arcs
    for (let f = 0; f < 3; f += 1) {
      const a0 = ts * 0.2 + f * ((Math.PI * 2) / 3)
      for (let s = 0; s <= 24; s += 1) {
        const a = a0 + (s / 24) * 0.8
        if (hash(s, 700 + f) < 0.3) continue
        dot(cx + Math.cos(a) * sunR * 2.5, cy + Math.sin(a) * sunR * 2.5, 2, true, 0.7)
      }
    }
    // slow instrument tick ring, game chrome
    for (let s = 0; s < 48; s += 1) {
      const a = (s / 48) * Math.PI * 2 + ts * 0.05
      const major = s % 12 === 0
      if (!major && hash(s, 909) < 0.5) continue
      dot(cx + Math.cos(a) * sunR * 3.0, cy + Math.sin(a) * sunR * 3.0, major ? 2.4 : 1.5, major, major ? 0.9 : 0.5)
    }

    // safety net: push overlapping planets apart so discs (plus rings and
    // moons) always keep clear space. With the rigid carousel this settles
    // once and stays put.
    // Offsets persist across frames and ease toward the resolved layout.
    const bases: Pt[] = []
    for (let i = 0; i < count; i += 1) bases[i] = planetPos(i, ts, cx, cy, maxR)
    const resolved: Pt[] = bases.map((b, i) => ({ x: b.x + offsets[i].x, y: b.y + offsets[i].y }))
    const relaxIters = reduced ? 25 : 3
    for (let k = 0; k < relaxIters; k += 1) {
      for (let i = 0; i < count; i += 1) {
        for (let j = i + 1; j < count; j += 1) {
            const min = (PLANETS[i].size + PLANETS[j].size) * U + 30
          const dx = resolved[j].x - resolved[i].x
          const dy = resolved[j].y - resolved[i].y
          const d = Math.hypot(dx, dy) || 1
          if (d < min) {
            const push = (min - d) / 2 / d
            resolved[i].x -= dx * push
            resolved[i].y -= dy * push
            resolved[j].x += dx * push
            resolved[j].y += dy * push
          }
        }
      }
      // the sun holds its court: planet centers stay out of the disc
      const sunClear = maxR * 0.12
      for (let i = 0; i < count; i += 1) {
        const minSun = sunClear + PLANETS[i].size * U * 1.1 + 10
        const sx = resolved[i].x - cx
        const sy = resolved[i].y - cy
        const sd = Math.hypot(sx, sy) || 1
        if (sd < minSun) {
          resolved[i].x = cx + (sx / sd) * minSun
          resolved[i].y = cy + (sy / sd) * minSun
        }
      }
    }
    const ease = reduced ? 1 : 0.12
    for (let i = 0; i < count; i += 1) {
      offsets[i].x += (resolved[i].x - bases[i].x - offsets[i].x) * ease
      offsets[i].y += (resolved[i].y - bases[i].y - offsets[i].y) * ease
      centers[i] = { x: bases[i].x + offsets[i].x, y: bases[i].y + offsets[i].y }
    }

    // label layout pre-pass: anchor every tag radially outward from the
    // sun, then deconflict boxes against the sun, planet discs, and each
    // other so text is never covered by anything. Static formation, so
    // this settles into a clean fixed layout.
    const sunDiscR = maxR * 0.12
    const tagPx = Math.round(15 * Math.min(1, Math.max(U, 0.65)))
    ctx.font = `700 ${tagPx}px "JetBrains Mono", ui-monospace, monospace`
    const discR: number[] = []
    for (let i = 0; i < count; i += 1) discR[i] = PLANETS[i].size * U * (hover.index === i ? 1.22 : 1)
    const anchors: { x: number; y: number; align: CanvasTextAlign; w: number }[] = []
    for (let i = 0; i < count; i += 1) {
      const base = centers[i]
      let rx = base.x - cx
      let ry = base.y - cy
      const rl = Math.hypot(rx, ry) || 1
      rx /= rl
      ry /= rl
      const n = String(i + 1).padStart(2, '0')
      const w = ctx.measureText(`${n} · ${labels[i].toUpperCase()}`).width
      const align: CanvasTextAlign = rx < -0.25 ? 'right' : 'left'
      let ax = base.x + rx * (discR[i] + 16)
      let ay = base.y + ry * (discR[i] + 16)
      for (let k = 0; k < 12; k += 1) {
        let clear = true
        if (Math.hypot(ax - cx, ay - cy) < sunDiscR + tagPx + 6) clear = false
        for (let j = 0; j < count && clear; j += 1) {
          if (Math.hypot(ax - centers[j].x, ay - centers[j].y) < discR[j] + tagPx) clear = false
        }
        for (let j = 0; j < i && clear; j += 1) {
          const b = anchors[j]
          if (Math.abs(ax - b.x) < (w + b.w) / 2 + 8 && Math.abs(ay - b.y) < tagPx + 6) clear = false
        }
        if (clear) break
        ax += rx * 16
        ay += ry * 16
      }
      ax = Math.min(Math.max(ax, 8), W - 8)
      ay = Math.min(Math.max(ay, 20), H - 20)
      anchors[i] = { x: ax, y: ay, align, w }
    }
    labelBoxes = anchors.map((a) => ({ x: a.x, y: a.y, w: a.w, align: a.align }))

    // planets
    for (let i = 0; i < count; i += 1) {
      const p = PLANETS[i]
      const live = hover.index === i
      const dimmed = hover.index !== null && !live
      const pos = centers[i]
      const R = p.size * U * (live ? 1.22 : 1)
      const onScreen = pos.x > -R * 3 && pos.x < W + R * 3 && pos.y > -R * 3 && pos.y < H + R * 3

      // orbit path
      for (let s = 0; s <= 90; s += 1) {
        const a = (s / 90) * Math.PI * 2
        const ox = cx + Math.cos(a) * p.orbit * maxR * 1.15
        const oy = cy + Math.sin(a) * p.orbit * maxR * p.tilt
        const ix = Math.floor(ox / 6)
        const iy = Math.floor(oy / 6)
        if (hash(ix, iy + i * 31) < 0.72) continue
        dot(ox, oy, live ? 2 : 1.6, live, live ? 0.8 : 0.36)
      }
      if (!onScreen) continue

      // presence: soft glow halo + dotted halo ring so planets read as
      // foreground bodies, never background dust
      const haloR = R * (live ? 2.6 : 2.1)
      const hg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, haloR)
      hg.addColorStop(0, `rgba(255, 176, 66, ${(live ? 0.5 : dimmed ? 0.1 : 0.28).toFixed(3)})`)
      hg.addColorStop(1, 'rgba(255, 143, 18, 0)')
      ctx.fillStyle = hg
      ctx.fillRect(pos.x - haloR, pos.y - haloR, haloR * 2, haloR * 2)
      for (let s = 0; s <= 44; s += 1) {
        const a = (s / 44) * Math.PI * 2
        if (hash(s, i * 311 + 11) < 0.35) continue
        dot(pos.x + Math.cos(a) * R * 1.5, pos.y + Math.sin(a) * R * 1.5, live ? 2.4 : 1.8, live, live ? 0.9 : 0.5)
      }

      // sun-ward light for crescent phases
      const lx = cx - pos.x
      const ly = cy - pos.y
      const ll = Math.hypot(lx, ly) || 1
      const ldx = lx / ll
      const ldy = ly / ll

      const disc = (gain: number) => {
        const rad = Math.ceil(R) + 1
        for (let gy = -rad; gy <= rad; gy += 1) {
          for (let gx = -rad; gx <= rad; gx += 1) {
            const d = Math.hypot(gx, gy) / R
            if (d > 1) continue
            const li = 0.4 + 0.6 * Math.max(0, (gx / R) * ldx + (gy / R) * ldy)
            let b = (1 - d * 0.4) * li + 0.12
            if (p.bands) b *= 0.85 + 0.15 * Math.sin((gy / R) * 6 + 1 + ts * 0.35)
            // beacon hotspot on the experience world: a small round
            // capital-lights glint, never an oval smear
            if (p.bands) {
              const od = Math.hypot(gx / R / 0.2, (gy - R * 0.2) / R / 0.2)
              if (od < 1) b = Math.max(b, 1.0)
            }
            const ix = Math.floor((pos.x + gx) / 3)
            const iy = Math.floor((pos.y + gy) / 3)
            const shimmer = 0.7 + 0.3 * Math.sin(ts * 1.8 + ix * 0.8 + iy)
            const thr = (BAYER[(iy % 4) * 4 + (ix % 4)] / 16) * 0.68 + 0.1 * Math.sin(ts * 2.4 + ix)
            if (b * shimmer * 0.8 < thr) continue
            // bright limb on the lit edge
            const rim = d > 0.82 && li > 0.5
            dot(pos.x + gx, pos.y + gy, 0.8 + b * 0.9, b > 0.75 || rim, Math.min(1, b + 0.3) * gain)
          }
        }
      }

      // twin ring bands with a Cassini division: back half, disc, front half
      const ringBand = (front: boolean) => {
        for (const rr of [1.55, 2.05]) {
          for (let s = 0; s <= 80; s += 1) {
            const a = (s / 80) * Math.PI * 2
            const rx = pos.x + Math.cos(a) * R * rr
            const ry = pos.y + Math.sin(a) * R * rr * 0.36
            if (front ? ry <= pos.y : ry > pos.y) continue
            if (hash(s + Math.floor(rr * 10), i * 17 + 3) < 0.45) continue
            dot(rx, ry, front ? 2 : 1.7, front && live, front ? (live ? 1 : 0.8) : 0.6)
          }
        }
      }
      if (p.ring) ringBand(false)
      disc(live ? 1.5 : dimmed ? 0.65 : 1.15)
      if (p.ring) ringBand(true)
      if (p.moon) {
        for (let s = 0; s <= 26; s += 1) {
          const a = (s / 26) * Math.PI * 2
          if (hash(s, i * 91 + 5) < 0.6) continue
          dot(pos.x + Math.cos(a) * R * 2.3, pos.y + Math.sin(a) * R * 2.3 * 0.6, 1.3, false, 0.5)
        }
        const ma = ts * 0.5 + i
        dot(pos.x + Math.cos(ma) * R * 2.3, pos.y + Math.sin(ma) * R * 2.3 * 0.6, 2.6, true, 0.9)
      }

      // targeting reticle on the lit planet: rotating dotted lock ring
      // plus corner brackets, game-style
      if (live) {
        const rr = R * 1.9
        for (let s = 0; s <= 64; s += 1) {
          const a = (s / 64) * Math.PI * 2 + ts * 0.9
          if (hash(s, i * 401 + 21) < 0.35) continue
          dot(pos.x + Math.cos(a) * rr, pos.y + Math.sin(a) * rr, 2.4, true, 0.95)
        }
        const B = R * 2.25
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          for (let k = 0; k <= 3; k += 1) {
            dot(pos.x + sx * B - sx * k * 3.4, pos.y + sy * B, 2.4, true, 1)
            dot(pos.x + sx * B, pos.y + sy * B - sy * k * 3.4, 2.4, true, 1)
          }
        }
      }

      // spoke to the sun: this page's line to the center
      const dx = cx - pos.x
      const dy = cy - pos.y
      const dist = Math.hypot(dx, dy) || 1
      const n = Math.max(12, Math.floor(dist / 10))
      for (let s = 0; s <= n; s += 1) {
        const qx = pos.x + (dx * s) / n
        const qy = pos.y + (dy * s) / n
        const ix = Math.floor(qx / 4)
        const iy = Math.floor(qy / 4)
        const shimmer = 0.6 + 0.4 * Math.sin(ts * 2 + ix * 0.8 + s * 0.3)
        const thr = (BAYER[(iy % 4) * 4 + (ix % 4)] / 16) * 0.5 + 0.08 * Math.sin(ts * 2.4 + s)
        const b = (0.45 + 0.55 * hash(ix + i * 57, iy)) * shimmer
        if (b < thr) continue
        dot(qx, qy, live ? 3.2 : 2.6, live ? b > 0.55 : b > 0.8, (live ? 1 : dimmed ? 0.4 : 0.85) * Math.min(1, b + 0.3))
      }
      const speed = live ? 0.3 : 0.12
      for (let k = 0; k < (live ? 4 : 2); k += 1) {
        const pr = (ts * speed + k * 0.5 + i * 0.13) % 1
        dot(pos.x + dx * pr, pos.y + dy * pr, live ? 3.6 : 3, true, live ? 1 : dimmed ? 0.45 : 0.75)
      }

      // anchored tag: dotted leader from the disc edge, shadowed text so
      // it survives any crossing; live tag gets lock prefix + underline
      const anch = anchors[i]
      const pl = Math.hypot(pos.x - cx, pos.y - cy) || 1
      const lx0 = pos.x + ((pos.x - cx) / pl) * R
      const ly0 = pos.y + ((pos.y - cy) / pl) * R
      const ln = Math.max(4, Math.floor(Math.hypot(anch.x - lx0, anch.y - ly0) / 7))
      for (let s = 0; s <= ln; s += 1) {
        if (hash(s + i * 77, 313) < 0.45) continue
        dot(lx0 + ((anch.x - lx0) * s) / ln, ly0 + ((anch.y - ly0) * s) / ln, live ? 2 : 1.5, live, live ? 0.8 : 0.45)
      }
      ctx.textBaseline = 'middle'
      ctx.textAlign = anch.align
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 7
      ctx.fillStyle = live ? 'rgba(255, 214, 140, 1)' : 'rgba(255, 178, 80, 0.88)'
      const num = String(i + 1).padStart(2, '0')
      ctx.fillText((live ? `> ${num} · ` : `${num} · `) + labels[i].toUpperCase(), anch.x, anch.y)
      ctx.shadowBlur = 0
      if (live) {
        const tw = anch.w
        const x0 = anch.align === 'right' ? anch.x - tw : anch.x
        for (let px = 0; px <= tw; px += 4) {
          dot(x0 + px, anch.y + tagPx + 2, 1.8, true, 0.95)
        }
      }
      if (live && !reduced) {
        ctx.textAlign = 'center'
        for (let k = 0; k < 3; k += 1) {
          const pr = (ts * 0.2 + k * 0.33 + i * 0.17) % 1
          const level = Math.floor((0.5 + 0.5 * Math.sin(ts * 3 + k * 2 + i)) * (RUNES.length - 1))
          ctx.fillStyle = 'rgba(255, 196, 107, 0.75)'
          ctx.fillText(RUNES[level], pos.x + dx * pr, pos.y + dy * pr - 11)
        }
      }
    }
  }

  const hit = (mx: number, my: number): number | null => {
    const rect = canvas.getBoundingClientRect()
    // map through any CSS/backing-store size mismatch (mobile URL bars,
    // orientation flips) so taps land where the planets are drawn
    const sx = canvas.width / (rect.width || 1)
    const sy = canvas.height / (rect.height || 1)
    const x = (mx - rect.left) * sx
    const y = (my - rect.top) * sy
    // fat-finger floor: tiny scaled-down planets stay tappable, and the
    // nearest candidate wins so overlapping zones pick the intended body
    const touchR = 34 * Math.max(sx, sy)
    const { U: hu } = fitSystem()
    let best: number | null = null
    let bestD = Infinity
    for (let i = 0; i < count; i += 1) {
      const c = centers[i]
      if (!c) continue
      const R = PLANETS[i].size * hu
      const d = Math.hypot(x - c.x, y - c.y)
      if (d < Math.max(R + 16, touchR) && d < bestD) {
        best = i
        bestD = d
      }
    }
    if (best !== null) return best
    for (let i = 0; i < count; i += 1) {
      const lb = labelBoxes[i]
      if (!lb) continue
      const x0 = lb.align === 'right' ? lb.x - lb.w : lb.x
      if (x > x0 - 6 && x < x0 + lb.w + 6 && Math.abs(y - lb.y) < Math.max(14, touchR / 2)) return i
    }
    return null
  }

  let canvasLit = false
  const onMove = (e: MouseEvent) => {
    const i = hit(e.clientX, e.clientY)
    canvas.style.cursor = i !== null ? 'pointer' : 'default'
    if (i !== null) {
      hover.index = i
      canvasLit = true
    } else if (canvasLit) {
      hover.index = null
      canvasLit = false
    }
  }
  const onClick = (e: MouseEvent) => {
    const i = hit(e.clientX, e.clientY)
    if (i !== null) onSelect(i)
  }
  // touch ignition: light the planet under the finger on contact so taps
  // give instant feedback; the synthesized click then lands the page
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    const i = hit(t.clientX, t.clientY)
    if (i !== null) {
      hover.index = i
      canvasLit = true
    } else if (canvasLit) {
      hover.index = null
      canvasLit = false
    }
  }
  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('click', onClick)
  canvas.addEventListener('touchstart', onTouch, { passive: true })
  canvas.addEventListener('touchmove', onTouch, { passive: true })

  const frame = (t: number) => {
    if (reduced) {
      if (hover.index !== lastHover) {
        lastHover = hover.index
        draw(1200)
      }
    } else if (t - last > 33) {
      last = t
      draw(t)
    }
    raf = requestAnimationFrame(frame)
  }
  // Always run the loop so hover relights even in reduced mode; the frozen
  // timestamp keeps every dot perfectly still.
  draw(reduced ? 1200 : performance.now())
  lastHover = hover.index
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    canvas.removeEventListener('mousemove', onMove)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('touchstart', onTouch)
    canvas.removeEventListener('touchmove', onTouch)
    window.removeEventListener('resize', resize)
  }
}
