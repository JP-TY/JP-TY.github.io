/**
 * The ASCII rocket cursor.
 * A DOM <pre> that chases the virtual pointer with spring physics,
 * banks into velocity, and bleeds pooled exhaust glyphs.
 * Screen-space only — it never touches the render loop's 3D work.
 */

const ROCKET_N = [
  '  /\\  ',
  ' /  \\ ',
  ' |  | ',
  ' |##| ',
  ' |##| ',
  ' \\__/ ',
  '  ||  ',
]
const ROCKET_THRUST = [
  '  /\\  ',
  ' /  \\ ',
  ' |  | ',
  ' |##| ',
  ' |##| ',
  ' \\__/ ',
  '  \\/  ',
  '  **  ',
]
const EXHAUST_GLYPHS = ['*', '+', '·', ':', '.']

const TAIL_OFFSET = 26 // px below the rocket center where exhaust spawns

export interface PointerSource {
  /** Current virtual pointer (screen px). */
  pointer: { x: number; y: number }
}

export class Rocket {
  private el: HTMLPreElement
  private exhaustLayer: HTMLDivElement
  private particles: { el: HTMLSpanElement; vx: number; vy: number; life: number; active: boolean }[] = []
  private pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  private vel = { x: 0, y: 0 }
  private angle = 0
  private frame = 0
  private frameTimer = 0
  private lastTime = performance.now()
  private locked = false
  private visible = false
  private reducedMotion: boolean
  private touch: boolean
  private spawnTimer = 0
  private source: PointerSource

  constructor(source: PointerSource, reducedMotion: boolean, touch: boolean) {
    this.source = source
    this.reducedMotion = reducedMotion
    this.touch = touch
    this.el = document.getElementById('rocket') as HTMLPreElement
    this.exhaustLayer = document.getElementById('exhaust') as HTMLDivElement
    this.el.textContent = ROCKET_N.join('\n')
    this.el.style.opacity = '0'

    // Warm the particle pool (24 glyphs, recycled forever).
    for (let i = 0; i < 24; i++) {
      const span = document.createElement('span')
      span.textContent = EXHAUST_GLYPHS[i % EXHAUST_GLYPHS.length]
      span.style.opacity = '0'
      this.exhaustLayer.appendChild(span)
      this.particles.push({ el: span, vx: 0, vy: 0, life: 0, active: false })
    }

    if (touch) {
      this.el.style.display = 'none'
    } else {
      window.addEventListener('pointermove', (e) => {
        if (!this.visible) {
          this.visible = true
          this.el.style.opacity = '1'
          this.pos.x = e.clientX
          this.pos.y = e.clientY
        }
      }, { passive: true })
    }
    this.loop()
  }

  setLocked(locked: boolean, accent?: string): void {
    this.locked = locked
    this.el.classList.toggle('locked', locked)
    if (accent) this.el.style.setProperty('color', accent)
    else this.el.style.removeProperty('color')
  }

  /** Hide during panel-open (the rocket hands over to the panel). */
  setParked(parked: boolean): void {
    this.el.style.opacity = parked ? '0' : this.visible ? '1' : '0'
  }

  private loop = (): void => {
    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    if (!this.touch) this.step(dt)
    requestAnimationFrame(this.loop)
  }

  private step(dt: number): void {
    const target = this.source.pointer
    const k = this.reducedMotion ? 60 : 14 // spring stiffness
    const ax = (target.x - this.pos.x) * k
    const ay = (target.y - this.pos.y) * k
    this.vel.x += ax * dt
    this.vel.y += ay * dt
    this.vel.x *= Math.pow(0.0009, dt)
    this.vel.y *= Math.pow(0.0009, dt)
    this.pos.x += this.vel.x * dt
    this.pos.y += this.vel.y * dt

    // Bank into velocity (nose points along movement).
    const speed = Math.hypot(this.vel.x, this.vel.y)
    if (speed > 24) {
      const targetAngle = Math.atan2(this.vel.y, this.vel.x) + Math.PI / 2
      let delta = targetAngle - this.angle
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      this.angle += delta * Math.min(dt * 10, 1)
    } else {
      this.angle += (0 - this.angle) * Math.min(dt * 4, 1)
    }

    // Thrust frame swap while moving fast.
    this.frameTimer += dt
    if (this.frameTimer > 0.09) {
      this.frameTimer = 0
      this.frame = (this.frame + 1) % 2
      this.el.textContent = (speed > 60 ? ROCKET_THRUST : ROCKET_N).join('\n')
    }

    const bob = this.reducedMotion ? 0 : Math.sin(performance.now() / 500) * 1.5
    this.el.style.transform =
      `translate(-50%, -50%) translate(${this.pos.x.toFixed(1)}px, ${(this.pos.y + bob).toFixed(1)}px) rotate(${this.angle.toFixed(3)}rad)`

    if (!this.reducedMotion) this.spawnExhaust(dt, speed)
    this.stepParticles(dt)
  }

  private spawnExhaust(dt: number, speed: number): void {
    if (speed < 30) return
    this.spawnTimer += dt
    if (this.spawnTimer < 0.03) return
    this.spawnTimer = 0
    const p = this.particles.find((q) => !q.active)
    if (!p) return
    // Tail position: rotate the tail offset by -angle (screen y is down).
    const rad = -this.angle
    const tx = this.pos.x - Math.sin(rad) * TAIL_OFFSET
    const ty = this.pos.y + Math.cos(rad) * TAIL_OFFSET
    p.active = true
    p.life = 0.5 + Math.random() * 0.3
    p.vx = -this.vel.x * 0.06 + (Math.random() - 0.5) * 30
    p.vy = -this.vel.y * 0.06 + (Math.random() - 0.5) * 30
    p.el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) translate(-50%, -50%)`
    p.el.style.opacity = this.locked ? '0.9' : '0.7'
  }

  private stepParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        p.el.style.opacity = '0'
        continue
      }
      p.vx *= 1 - dt * 2
      p.vy *= 1 - dt * 2
      const cur = p.el.style.transform
      const m = cur.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)
      if (m) {
        const x = parseFloat(m[1]) + p.vx * dt
        const y = parseFloat(m[2]) + p.vy * dt
        p.el.style.transform = cur.replace(
          /translate\([-\d.]+px, [-\d.]+px\)/,
          `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        )
      }
      p.el.style.opacity = String(Math.min(parseFloat(p.el.style.opacity || '0.7'), p.life * 2))
    }
  }
}

