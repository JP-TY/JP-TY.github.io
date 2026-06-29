/**
 * Field portrait: the real photo re-graded as smooth amber phosphor,
 * keeping the face fully recognizable. Luminance is mapped through a
 * warm duotone ramp with a gentle contrast curve and a light
 * ordered-dither grain for CRT texture, plus baked scanlines, a soft
 * vignette, and a slow scan band. Only the scan band moves. Static frame
 * under reduced motion. The fallback <img> stays visible if the photo
 * fails to load or canvas is unavailable.
 */

const SCALE = 2

function ramp(l: number): [number, number, number] {
  // deep warm black -> amber -> hot amber highlight
  const dark: [number, number, number] = [14, 9, 3]
  const mid: [number, number, number] = [255, 165, 59]
  const hot: [number, number, number] = [255, 205, 120]
  const a = l < 0.55 ? l / 0.55 : 1
  const b = l < 0.55 ? 0 : (l - 0.55) / 0.45
  const mix = (
    u: [number, number, number],
    v: [number, number, number],
    t: number,
  ): [number, number, number] => [
    u[0] + (v[0] - u[0]) * t,
    u[1] + (v[1] - u[1]) * t,
    u[2] + (v[2] - u[2]) * t,
  ]
  return mix(mix(dark, mid, a * a * (3 - 2 * a)), hot, b * b * (3 - 2 * b))
}

export function startPortrait(
  canvas: HTMLCanvasElement,
  fallback: HTMLImageElement,
  src: string,
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf = 0
  let dead = false
  const stop = () => {
    dead = true
    cancelAnimationFrame(raf)
  }

  const img = new Image()
  img.src = src
  img.onload = () => {
    if (dead) return
    const aspect = img.naturalHeight / img.naturalWidth || 1
    const W = Math.round(240 * SCALE)
    const H = Math.round(240 * aspect * SCALE)
    canvas.width = W
    canvas.height = H
    canvas.style.aspectRatio = `${W} / ${H}`

    // draw cover-fit, then re-grade every pixel through the amber ramp
    const work = document.createElement('canvas')
    work.width = W
    work.height = H
    const wctx = work.getContext('2d', { willReadFrequently: true })
    if (!wctx) return
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    wctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
    const frame = wctx.getImageData(0, 0, W, H)
    const d = frame.data
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4
        const l =
          0.2126 * (d[i] / 255) +
          0.7152 * (d[i + 1] / 255) +
          0.0722 * (d[i + 2] / 255)
        // gamma lift + gain: midtones render instead of dropping out.
        // No dither grain: the grade stays perfectly smooth so the face
        // renders clean with zero block artifacting.
        const c = Math.min(
          1,
          Math.max(0, (Math.pow(l, 0.85) - 0.5) * 1.6 + 0.5),
        )
        const [r, g, b] = ramp(c)
        d[i] = r
        d[i + 1] = g
        d[i + 2] = b
        d[i + 3] = 255
      }
    }
    wctx.putImageData(frame, 0, 0)

    // baked scanlines + vignette
    wctx.fillStyle = 'rgba(0, 0, 0, 0.16)'
    for (let y = 1; y < H; y += 3) wctx.fillRect(0, y, W, 1)
    const vg = wctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.35,
      W / 2, H / 2, Math.max(W, H) * 0.72,
    )
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.38)')
    wctx.fillStyle = vg
    wctx.fillRect(0, 0, W, H)

    fallback.hidden = true
    canvas.hidden = false

    const paint = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(work, 0, 0)
      if (!reduced) {
        const ts = t / 1000
        const bandY = ((ts * 60) % (H + 120)) - 60
        ctx.fillStyle = 'rgba(255, 205, 120, 0.06)'
        ctx.fillRect(0, bandY - 18, W, 36)
      }
    }

    if (reduced) {
      paint(1200)
      return
    }
    let last = 0
    const loop = (t: number) => {
      if (dead) return
      if (t - last > 40) {
        last = t
        paint(t)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  }
  img.onerror = () => {
    // fallback <img> simply stays visible
  }
  return stop
}
