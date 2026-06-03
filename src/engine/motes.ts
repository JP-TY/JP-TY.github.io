/**
 * James Ty Portfolio — three-layer parallax ambience on a single canvas:
 * ember motes, diagonal gold streaks (at the wipe's -12° angle), and large
 * slow-rotating hollow diamonds. Subtle pointer parallax. Static under
 * reduced motion; rAF pauses when the tab is hidden.
 */

const MOTE_DENSITY = 9500 // px² per mote
const MAX_MOTES = 90
const STREAK_AREA = 90000 // px² per streak
const MAX_STREAKS = 16
const DIAMONDS = 7
const TILT = (-12 * Math.PI) / 180 // matches the wipe skew
const TILT_COS = Math.cos(TILT)
const TILT_SIN = Math.sin(TILT)

interface Mote {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  tw: number
  twSpeed: number
  alpha: number
}

interface Streak {
  x: number
  y: number
  len: number
  speed: number
  alpha: number
}

interface Diamond {
  x: number
  y: number
  size: number
  rot: number
  rotSpeed: number
  vy: number
  alpha: number
}

export function startMotes(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf = 0
  let running = false
  let motes: Mote[] = []
  let streaks: Streak[] = []
  let diamonds: Diamond[] = []
  let w = 0
  let h = 0
  let dpr = 1
  // pointer parallax: eased toward the pointer offset each frame
  let px = 0
  let py = 0
  let tx = 0
  let ty = 0

  function spawnMote(): Mote {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.7,
      vx: -0.05 + Math.random() * 0.1,
      vy: -0.16 - Math.random() * 0.22,
      tw: Math.random() * Math.PI * 2,
      twSpeed: 0.4 + Math.random() * 1.1,
      alpha: 0.16 + Math.random() * 0.3,
    }
  }

  function spawnStreak(): Streak {
    return {
      x: Math.random() * (w + 520) - 260,
      y: Math.random() * (h + 520) - 260,
      len: 90 + Math.random() * 160,
      speed: 0.5 + Math.random() * 1.1,
      alpha: 0.04 + Math.random() * 0.08,
    }
  }

  function spawnDiamond(): Diamond {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: 60 + Math.random() * 130,
      rot: Math.random() * Math.PI,
      rotSpeed: (-0.5 + Math.random()) * 0.0016,
      vy: -0.03 - Math.random() * 0.05,
      alpha: 0.025 + Math.random() * 0.03,
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    motes = Array.from({ length: Math.min(MAX_MOTES, Math.max(24, Math.floor((w * h) / MOTE_DENSITY))) }, () => spawnMote())
    streaks = Array.from({ length: Math.min(MAX_STREAKS, Math.max(6, Math.floor((w * h) / STREAK_AREA))) }, () => spawnStreak())
    diamonds = Array.from({ length: DIAMONDS }, () => spawnDiamond())
    if (reduced) draw()
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h)
    // diamonds — deepest layer, strongest parallax
    for (const d of diamonds) {
      ctx!.save()
      ctx!.translate(d.x + px * 16, d.y + py * 16)
      ctx!.rotate(d.rot)
      ctx!.strokeStyle = `rgba(201, 161, 62, ${d.alpha.toFixed(3)})`
      ctx!.lineWidth = 1
      ctx!.strokeRect(-d.size / 2, -d.size / 2, d.size, d.size)
      ctx!.restore()
    }
    // streaks — diagonal gold hairlines at the wipe angle
    for (const s of streaks) {
      const x = s.x + px * 9
      const y = s.y + py * 9
      ctx!.strokeStyle = `rgba(240, 208, 120, ${s.alpha.toFixed(3)})`
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(x, y)
      ctx!.lineTo(x + TILT_COS * s.len, y + TILT_SIN * s.len)
      ctx!.stroke()
    }
    // motes — nearest layer, gentlest parallax
    for (const m of motes) {
      const a = m.alpha * (0.65 + 0.35 * Math.sin(m.tw))
      ctx!.beginPath()
      ctx!.fillStyle = `rgba(240, 208, 120, ${a.toFixed(3)})`
      ctx!.arc(m.x + px * 4, m.y + py * 4, m.r, 0, Math.PI * 2)
      ctx!.fill()
    }
  }

  function tick() {
    px += (tx - px) * 0.04
    py += (ty - py) * 0.04
    for (const m of motes) {
      m.x += m.vx
      m.y += m.vy
      m.tw += 0.016 * m.twSpeed
      if (m.y < -6) {
        m.y = h + 6
        m.x = Math.random() * w
      }
      if (m.x < -6) m.x = w + 6
      if (m.x > w + 6) m.x = -6
    }
    for (const s of streaks) {
      s.x += s.speed * TILT_COS
      s.y += s.speed * TILT_SIN
      if (s.x > w + 260) s.x -= w + 520
      if (s.x < -260) s.x += w + 520
      if (s.y < -260) s.y += h + 520
      if (s.y > h + 260) s.y -= h + 520
    }
    for (const d of diamonds) {
      d.rot += d.rotSpeed
      d.y += d.vy
      if (d.y < -d.size) d.y = h + d.size
    }
    draw()
    raf = requestAnimationFrame(tick)
  }

  function onPointer(e: PointerEvent) {
    tx = (e.clientX / w - 0.5) * 2
    ty = (e.clientY / h - 0.5) * 2
  }

  function start() {
    if (running || reduced) return
    running = true
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  resize()
  window.addEventListener('resize', resize)

  if (reduced) {
    draw() // a still engraving of gold — no drift, no loop
    return () => window.removeEventListener('resize', resize)
  }

  window.addEventListener('pointermove', onPointer)
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  start()

  return () => {
    stop()
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointer)
  }
}
