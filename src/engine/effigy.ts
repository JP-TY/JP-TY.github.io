/**
 * Accretion Hole: scaled-up black hole rendered as a boiling ASCII/dot-matrix
 * hybrid for a CRT-monitor feel. An analytic glow field (halo, tilted
 * accretion band with Doppler limbs and differential rotation, shadow core,
 * photon ring, lensed arcs, breathing disk) is quantized through a
 * time-jittered Bayer threshold: bright cells resolve into mutating ASCII
 * glyphs, dim cells stay LED dots. Boot-scoped: starts on boot, stops dead
 * on finish. Static single frame under reduced motion. Pure chrome.
 */

const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]
const GLYPHS = ' .·:+*x#%@'
const CELL = 10
const MAX_COLS = 150
const MAX_ROWS = 100

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >> 13)) | 0
  h = (h * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

function sstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function startEffigy(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const parent = canvas.parentElement
  const W = Math.max(320, parent?.clientWidth || window.innerWidth)
  const H = Math.max(480, parent?.clientHeight || window.innerHeight)
  canvas.width = W
  canvas.height = H
  const cols = Math.max(24, Math.min(MAX_COLS, Math.floor(W / CELL)))
  const rows = Math.max(24, Math.min(MAX_ROWS, Math.floor(H / CELL)))
  const ox = (W - cols * CELL) / 2
  const oy = (H - rows * CELL) / 2

  const grain: number[] = []
  for (let i = 0; i < cols * rows; i += 1) {
    grain.push(hash(i % cols, Math.floor(i / cols)))
  }

  let raf = 0
  let last = 0

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const draw = (t: number) => {
    const cx = W / 2
    const cy = H * 0.42
    const R = Math.min(W, H) * 0.68
    const ts = t / 1000
    // disk precession: the tilt breathes so the hole feels alive
    const tilt = 0.34 + 0.022 * Math.sin(ts * 0.23)
    const tq = Math.floor(ts * 8) // glyph boil quantum
    ctx.clearRect(0, 0, W, H)

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const px = ox + (x + 0.5) * CELL
        const py = oy + (y + 0.5) * CELL
        const dx = (px - cx) / R
        const dyTilt = (py - cy) / (R * tilt)
        const rr = Math.hypot(px - cx, py - cy) / R
        const ang = Math.atan2(dyTilt, dx)

        // gravitational warp: light bends around the shadow, pushing the
        // apparent band outward near the shadow edge
        const lens = Math.exp(-(((rr - 0.6) / 0.3) * ((rr - 0.6) / 0.3)))
        const ringR = 1.0 + 0.12 * lens
        const ringD = Math.hypot(dx, dyTilt) - ringR
        // thin disk: crisp plane, not a fuzzy donut
        let band = Math.exp(-((ringD / 0.09) * (ringD / 0.09)))
        // Doppler: approaching (left) limb sears, receding limb smolders
        const doppler = 0.25 + 0.75 * (0.5 - 0.5 * Math.cos(ang))
        // differential rotation: inner material orbits faster
        const spin = 0.9 + 1.6 * Math.exp(-rr)
        const streak = 0.6 + 0.4 * Math.sin(ang * 6 - ts * spin + rr * 3)
        band *= doppler * streak

        // front pass: the near side of the disk crosses IN FRONT of the
        // shadow, vertically squeezed by the viewing angle, dimmed
        const dyF = dyTilt * 0.5
        const ringDF = Math.hypot(dx, dyF) - 1.0
        const bandF =
          Math.exp(-((ringDF / 0.09) * (ringDF / 0.09))) * doppler * streak
        const inside = 1 - sstep(0.4, 0.62, rr)

        // shadow blocks background light, but the front pass shines through
        const shadowSoft = sstep(0.42, 0.55, rr)
        // photon ring: thin and crisp on the shadow edge
        const pr = (rr - 0.47) / 0.018
        const photon = Math.exp(-pr * pr)
        // inner rim: the disk's hottest lip just outside the shadow
        const rimD = (rr - 0.56) / 0.045
        const rim = Math.exp(-rimD * rimD) * (0.5 + 0.5 * doppler)
        // lensed arcs: over the crown and under the foot of the shadow
        const inTop = ang > Math.PI * 1.06 && ang < Math.PI * 1.94 ? 1 : 0
        const arcTD =
          (Math.hypot(dx / 0.62, (py - cy + R * 0.12) / (R * 0.34)) - 1) / 0.06
        const arcTop = inTop * Math.exp(-arcTD * arcTD)
        const inBot = ang > Math.PI * 0.06 && ang < Math.PI * 0.94 ? 1 : 0
        const arcBD =
          (Math.hypot(dx / 0.62, (py - cy - R * 0.12) / (R * 0.34)) - 1) / 0.06
        const arcBot = inBot * Math.exp(-arcBD * arcBD)
        // halo falloff, breathing: whisper only, structure dominates
        const halo = Math.exp(-rr / 1.4) * 0.12 * (0.9 + 0.1 * Math.sin(ts * 0.7))
        // faint infall swirl deep inside so the core is never a void
        const swirl =
          (0.5 + 0.5 * Math.sin(ang * 5 + rr * 9 - ts * 1.2)) *
          0.05 *
          (1 - sstep(0.0, 0.32, rr))

        const g = grain[y * cols + x]
        const shimmer = 0.8 + 0.14 * Math.sin(ts * 1.1 + x * 0.32 + y * 0.51) + 0.12 * g
        const flicker = 0.95 + 0.05 * Math.sin(ts * 9 + x * 1.7)
        let b =
          (band * 1.6 + photon * 1.8 + rim * 1.5 + arcTop * 1.1 + arcBot * 0.55 + halo) *
            shadowSoft *
            shimmer *
            flicker +
          bandF * inside * 0.5 * shimmer +
          swirl * shimmer
        b = Math.min(1.5, b * 1.5)
        if (b < 0.05) continue

        // animated Bayer dither: threshold breathes so dots crawl like CRT grain
        const thresh =
          (BAYER[(y % 4) * 4 + (x % 4)] / 16) * 0.35 +
          0.12 * Math.sin(ts * 3 + x * 0.8 + y * 0.6)
        if (b < thresh) continue

        // ASCII boil: bright cells resolve into glyphs that mutate a few
        // times a second; dim cells stay LED dots. The split is the look.
        let level = Math.min(9, Math.floor(b * 8))
        const boil = hash(x * 3 + tq * 57, y * 7 - tq * 131)
        level += boil > 0.78 ? 1 : boil < 0.22 ? -1 : 0
        level = Math.max(0, Math.min(9, level))
        const heat = b > 0.95 ? 2 : b > 0.7 ? 1 : 0
        const alpha = Math.min(1, b).toFixed(3)
        if (level >= 5) {
          ctx.font = `${Math.floor(CELL * 0.95)}px "JetBrains Mono", ui-monospace, monospace`
          ctx.fillStyle =
            heat === 2
              ? `rgba(255, 196, 107, ${alpha})`
              : heat === 1
                ? `rgba(255, 143, 18, ${alpha})`
                : `rgba(255, 165, 59, ${alpha})`
          ctx.fillText(GLYPHS[level], px, py)
        } else {
          const size = Math.max(1, CELL * (0.18 + 0.5 * Math.min(1, b)))
          ctx.fillStyle = `rgba(255, 165, 59, ${alpha})`
          ctx.fillRect(px - size / 2, py - size / 2, size, size)
        }
      }
    }

    // rolling CRT band (centered, never touches the edges)
    if (!reduced) {
      const bandY = ((ts * 90) % (H + 160)) - 80
      const grad = ctx.createLinearGradient(0, bandY - 30, 0, bandY + 30)
      grad.addColorStop(0, 'rgba(255, 165, 59, 0)')
      grad.addColorStop(0.5, 'rgba(255, 165, 59, 0.06)')
      grad.addColorStop(1, 'rgba(255, 165, 59, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(W * 0.2, bandY - 30, W * 0.6, 60)
    }
    // feather passes: dissolve all four edges (then corners doubly so)
    // to transparency, so the canvas never reads as a rectangle
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    const featherV = ctx.createLinearGradient(0, 0, 0, H)
    featherV.addColorStop(0, 'rgba(0, 0, 0, 0)')
    featherV.addColorStop(0.08, 'rgba(0, 0, 0, 1)')
    featherV.addColorStop(0.92, 'rgba(0, 0, 0, 1)')
    featherV.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = featherV
    ctx.fillRect(0, 0, W, H)
    const featherH = ctx.createLinearGradient(0, 0, W, 0)
    featherH.addColorStop(0, 'rgba(0, 0, 0, 0)')
    featherH.addColorStop(0.1, 'rgba(0, 0, 0, 1)')
    featherH.addColorStop(0.9, 'rgba(0, 0, 0, 1)')
    featherH.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = featherH
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }

  if (reduced) {
    draw(1200)
    return () => undefined
  }

  const frame = (t: number) => {
    if (t - last > 33) {
      last = t
      draw(t)
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
