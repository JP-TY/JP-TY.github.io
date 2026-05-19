/**
 * Scene controller: camera rig (custom orbit), render loop,
 * raycast hover/dock detection, docking flight.
 */
import * as THREE from 'three'
import { AsciiRenderer } from './ascii-renderer'
import { SolarSystem, type Body } from './solar-system'

export interface SceneEvents {
  onHover(body: Body | null): void
  onDock(bodyId: string): void
}

const PITCH_MIN = 0.18
const PITCH_MAX = 1.25
const DIST_MIN = 14
const DIST_MAX = 46

export class SceneController {
  private ascii: AsciiRenderer
  readonly system: SolarSystem
  private camera: THREE.PerspectiveCamera
  private raycaster = new THREE.Raycaster()
  private events: SceneEvents

  private theta = 0.9
  private phi = 0.62
  /** Staging distance: held until boot hands over, then dolled in (system reveal). */
  private dist = 54
  private thetaTarget = 0.9
  private phiTarget = 0.62
  private distTarget = 54

  private dragging = false
  private lastX = 0
  private lastY = 0
  private downX = 0
  private downY = 0
  private hoveredId: string | null = null

  /** Docking state: rocket autopilot takes over the pointer. */
  flying = false
  /** Current virtual pointer (screen px) — the rocket follows this. */
  pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.7 }

  reducedMotion: boolean

  constructor(canvas: HTMLCanvasElement, system: SolarSystem, reducedMotion: boolean, events: SceneEvents) {
    this.system = system
    this.events = events
    this.reducedMotion = reducedMotion
    if (reducedMotion) {
      this.dist = this.distTarget = 30 // no reveal dolly — start formed
    }
    this.ascii = new AsciiRenderer(canvas)
    document.fonts.ready.then(() => this.ascii.refreshAtlas()).catch(() => {})
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
    this.applyCamera()

    window.addEventListener('resize', () => {
      this.ascii.resize()
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    })

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      this.dragging = true
      this.lastX = this.downX = e.clientX
      this.lastY = this.downY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (this.flying) return
      if (this.dragging) {
        const dx = e.clientX - this.lastX
        const dy = e.clientY - this.lastY
        this.lastX = e.clientX
        this.lastY = e.clientY
        this.thetaTarget -= dx * 0.005
        this.phiTarget = THREE.MathUtils.clamp(this.phiTarget - dy * 0.004, PITCH_MIN, PITCH_MAX)
      } else if (e.pointerType === 'mouse') {
        this.pointer.x = e.clientX
        this.pointer.y = e.clientY
        this.updateHover(e.clientX, e.clientY)
      }
    })
    canvas.addEventListener('pointerup', (e) => {
      this.dragging = false
      const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY)
      if (moved < 8 && !this.flying) {
        const hit = this.pick(e.clientX, e.clientY)
        if (hit) this.events.onDock(hit)
      }
    })
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        this.distTarget = THREE.MathUtils.clamp(
          this.distTarget + e.deltaY * 0.02,
          DIST_MIN,
          DIST_MAX
        )
      },
      { passive: false }
    )

    let prev = performance.now()
    const loop = (now: number): void => {
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      this.frame(dt, now / 1000)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  /** System reveal: boot hands over, the camera falls in from staging distance. */
  reveal(): void {
    if (!this.reducedMotion) this.distTarget = 30
  }

  /** Fly the virtual pointer to a body (autopilot), then fire onDock. */
  flyTo(bodyId: string): void {
    const screen = this.system.screenPosition(bodyId, this.camera)
    if (!screen || this.reducedMotion) {
      if (screen) this.pointer = screen
      this.events.onDock(bodyId)
      return
    }
    this.flying = true
    const from = { ...this.pointer }
    const to = { ...screen }
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.max(Math.hypot(dx, dy), 1)
    // Perpendicular bezier bow: the approach should feel flown, not lerped.
    const c1 = { x: from.x + dx * 0.25 - (dy / dist) * dist * 0.25, y: from.y + dy * 0.25 + (dx / dist) * dist * 0.25 }
    const c2 = { x: from.x + dx * 0.75 + (dy / dist) * dist * 0.15, y: from.y + dy * 0.75 - (dx / dist) * dist * 0.15 }
    const duration = Math.min(1600, 500 + dist * 0.7)
    const start = performance.now()
    const step = (): void => {
      const t = Math.min((performance.now() - start) / duration, 1)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
      const mt = 1 - e
      this.pointer.x =
        mt * mt * mt * from.x + 3 * mt * mt * e * c1.x + 3 * mt * e * e * c2.x + e * e * e * to.x
      this.pointer.y =
        mt * mt * mt * from.y + 3 * mt * mt * e * c1.y + 3 * mt * e * e * c2.y + e * e * e * to.y
      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        this.flying = false
        this.events.onDock(bodyId)
      }
    }
    requestAnimationFrame(step)
  }

  private pick(x: number, y: number): string | null {
    this.raycaster.setFromCamera(
      new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1),
      this.camera
    )
    const hits = this.raycaster.intersectObjects(this.system.raycastTargets, false)
    return hits.length ? (hits[0].object.userData.bodyId as string) : null
  }

  private updateHover(x: number, y: number): void {
    const id = this.pick(x, y)
    if (id === this.hoveredId) return
    this.hoveredId = id
    this.system.setHighlighted(id)
    if (!id) {
      this.events.onHover(null)
      return
    }
    const body = id.startsWith('moon:')
      ? this.system.moons.get(id.slice(5))
      : this.system.bodies.get(id)
    this.events.onHover(body ?? null)
  }

  get hover(): string | null {
    return this.hoveredId
  }

  private applyCamera(): void {
    const sp = Math.sin(this.phi)
    this.camera.position.set(
      this.dist * sp * Math.sin(this.theta),
      this.dist * Math.cos(this.phi),
      this.dist * sp * Math.cos(this.theta)
    )
    this.camera.lookAt(0, 0, 0)
  }

  private frame(dt: number, time: number): void {
    this.theta += (this.thetaTarget - this.theta) * Math.min(dt * 8, 1)
    this.phi += (this.phiTarget - this.phi) * Math.min(dt * 8, 1)
    this.dist += (this.distTarget - this.dist) * Math.min(dt * 6, 1)
    // Calm idle: slow drift when the pilot isn't steering.
    if (!this.reducedMotion && !this.dragging) this.thetaTarget += 0.012 * dt
    this.applyCamera()
    if (!this.reducedMotion) this.system.update(dt)
    this.ascii.render(this.system.scene, this.camera, time)
  }
}


