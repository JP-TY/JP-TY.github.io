/** Two-layer ambience: drifting motes plus slow hairline streaks. Static frame under reduced motion. */

export function startMotes(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => undefined
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let raf = 0
  let w = 0
  let h = 0
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  const motes = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.6,
    s: 0.0002 + Math.random() * 0.0006,
    o: 0.12 + Math.random() * 0.3,
  }))

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h)
    // streaks
    ctx.save()
    ctx.strokeStyle = 'rgba(245,181,68,0.055)'
    ctx.lineWidth = 1
    for (let i = 0; i < 7; i += 1) {
      const y = ((t * 0.004 + i * 173) % (h + 200)) - 100
      ctx.beginPath()
      ctx.moveTo(-40, y)
      ctx.lineTo(w + 40, y - 140)
      ctx.stroke()
    }
    ctx.restore()
    // motes
    for (const m of motes) {
      const y = (m.y - t * m.s) % 1
      const yy = (yy0 => (yy0 < 0 ? yy0 + 1 : yy0))(y)
      ctx.beginPath()
      ctx.arc(m.x * w, yy * h, m.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(245,181,68,${m.o.toFixed(3)})`
      ctx.fill()
    }
  }

  if (reduced) {
    draw(1200)
    return () => window.removeEventListener('resize', resize)
  }

  const frame = (t: number) => {
    draw(t)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
