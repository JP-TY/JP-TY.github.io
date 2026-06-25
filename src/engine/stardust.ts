/**
 * Stardust: animated amber dither-dust backdrop for the skill constellation,
 * speaking the same language as the boot black hole. A coarse dot-matrix
 * field twinkles through a time-jittered Bayer threshold while sparse ASCII
 * glyphs boil at a slower quantum. Dim by design: it sits behind the hex
 * nodes, never competing with them. ~30fps throttle, static single frame
 * under reduced motion, pure chrome (aria-hidden).
 */

const RAMP = ' .·:+*x#%@'
const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]
const CELL = 14

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >> 13)) | 0
  h = (h * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

export function startStardust(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let W = 0
  let H = 0
  let cols = 0
  let rows = 0
  const resize = () => {
    const parent = canvas.parentElement
    W = Math.max(320, parent?.clientWidth || window.innerWidth)
    H = Math.max(320, parent?.clientHeight || window.innerHeight)
    canvas.width = W
    canvas.height = H
    cols = Math.floor(W / CELL)
    rows = Math.floor(H / CELL)
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0
  let last = 0

  const draw = (t: number) => {
    const ts = t / 1000
    const tq = Math.floor(ts * 5)
    ctx.clearRect(0, 0, W, H)
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const px = (x + 0.5) * CELL
        const py = (y + 0.5) * CELL
        const g = hash(x, y)
        // sparse boiling glyphs first: they read as constellation runes
        if (g > 0.972) {
          const boil = hash(x * 5 + tq * 91, y * 3 - tq * 47)
          const level = Math.min(
            RAMP.length - 1,
            Math.max(2, Math.floor((0.5 + 0.5 * Math.sin(ts * 1.4 + x + y * 0.7)) * RAMP.length) + (boil > 0.7 ? 1 : 0)),
          )
          ctx.font = '11px "JetBrains Mono", ui-monospace, monospace'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.fillStyle = `rgba(255, 165, 59, ${(0.28 + 0.18 * Math.sin(ts * 2 + x * 0.9)).toFixed(3)})`
          ctx.fillText(RAMP[level], px, py)
          continue
        }
        const twinkle = 0.55 + 0.45 * Math.sin(ts * 1.1 + x * 0.37 + y * 0.53)
        let b = g * twinkle
        if (b < 0.08) continue
        const thresh =
          (BAYER[(y % 4) * 4 + (x % 4)] / 16) * 0.5 +
          0.1 * Math.sin(ts * 2.6 + x * 0.8 + y * 0.6)
        if (b < thresh) continue
        const size = Math.max(1, CELL * (0.1 + 0.22 * Math.min(1, b)))
        const hot = b > 0.72
        ctx.fillStyle = hot
          ? `rgba(255, 196, 107, ${(b * 0.5).toFixed(3)})`
          : `rgba(255, 165, 59, ${(b * 0.5).toFixed(3)})`
        ctx.fillRect(px - size / 2, py - size / 2, size, size)
      }
    }
    if (!reduced) {
      const bandY = ((ts * 60) % (H + 160)) - 80
      const grad = ctx.createLinearGradient(0, bandY - 24, 0, bandY + 24)
      grad.addColorStop(0, 'rgba(255, 165, 59, 0)')
      grad.addColorStop(0.5, 'rgba(255, 165, 59, 0.05)')
      grad.addColorStop(1, 'rgba(255, 165, 59, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, bandY - 24, W, 48)
    }
  }

  if (reduced) {
    draw(1200)
    return () => window.removeEventListener('resize', resize)
  }

  const frame = (t: number) => {
    if (t - last > 33) {
      last = t
      draw(t)
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
