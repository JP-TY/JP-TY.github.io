/**
 * Animated black-hole favicon. A 48px canvas redraws the hole with a
 * slowly rotating accretion band a few times per second and swaps the
 * result into the icon link, so the tab icon genuinely animates in every
 * browser (no GIF or SMIL reliance). Pauses while the tab is hidden.
 * Static single frame under reduced motion. The static SVG link stays
 * as the fallback if canvas or data URLs are unavailable.
 */

const S = 48

export function startFavicon(): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  const cv = document.createElement('canvas')
  cv.width = S
  cv.height = S
  const ctx = cv.getContext('2d')
  if (!link || !ctx) return () => undefined

  const draw = (t: number) => {
    const ts = t / 1000
    const cx = S / 2
    const cy = S / 2
    const R = S * 0.3
    ctx.clearRect(0, 0, S, S)
    ctx.fillStyle = '#0a0c10'
    ctx.fillRect(0, 0, S, S)

    const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.9)
    halo.addColorStop(0, 'rgba(255, 143, 18, 0.55)')
    halo.addColorStop(1, 'rgba(255, 143, 18, 0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, S, S)

    // rotating accretion band, Doppler-split bright/dim limbs
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1, 0.42)
    ctx.lineCap = 'round'
    const rot = reduced ? 0 : ts * 0.7
    ctx.strokeStyle = '#ff9e2c'
    ctx.lineWidth = R * 0.44
    ctx.shadowColor = 'rgba(255, 158, 44, 0.9)'
    ctx.shadowBlur = 7
    ctx.beginPath()
    ctx.arc(0, 0, R, Math.PI * 0.15 + rot, Math.PI * 1.15 + rot)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255, 165, 59, 0.55)'
    ctx.lineWidth = R * 0.3
    ctx.beginPath()
    ctx.arc(0, 0, R, Math.PI * 1.15 + rot, Math.PI * 2.15 + rot)
    ctx.stroke()
    ctx.restore()

    // shadow + photon ring
    ctx.fillStyle = '#0a0c10'
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffc46b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.57, 0, Math.PI * 2)
    ctx.stroke()

    try {
      link.href = cv.toDataURL('image/png')
    } catch {
      /* static SVG icon remains */
    }
  }

  if (reduced) {
    draw(0)
    return () => undefined
  }

  let timer = 0
  const tick = () => draw(performance.now())
  const start = () => {
    window.clearInterval(timer)
    tick()
    timer = window.setInterval(tick, 140)
  }
  const onVis = () => {
    if (document.hidden) window.clearInterval(timer)
    else start()
  }
  document.addEventListener('visibilitychange', onVis)
  start()
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVis)
  }
}
