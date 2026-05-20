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
  onZone?(zone: 'ORBITAL' | 'SYSTEM' | 'GALACTIC'): void
}

const PITCH_MIN = 0.18
const PITCH_MAX = 1.25
/** Zoom continuum: orbital close-up ↔ system cruise ↔ galactic overview. */
const DIST_MIN = 4.2
const DIST_MAX = 700
const ORBITAL_ZONE = 13
const GALACTIC_ZONE = 220

const ORIGIN = new THREE.Vector3()
const FOCUS_POS = new THREE.Vector3()
const CAM_OFFSET = new THREE.Vector3()

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
  /** Zoom continuum: camera anchor — origin at system scale, a body up close. */
  private lookTarget = new THREE.Vector3()
  private zone: 'ORBITAL' | 'SYSTEM' | 'GALACTIC' = 'SYSTEM'
  private pointers = new Map<number, { x: number; y: number }>()
  private pinchDist = 0
  private pinched = false

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
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000)
    this.applyCamera()

    window.addEventListener('resize', () => {
      this.ascii.resize()
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    })

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.pointers.size === 2) {
        this.pinched = true
        this.pinchDist = this.pinchSpan()
      }
      this.dragging = true
      this.lastX = this.downX = e.clientX
      this.lastY = this.downY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (this.flying) return
      if (this.pointers.has(e.pointerId)) {
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      if (this.pointers.size >= 2 && this.pinchDist > 0) {
        // Two-finger pinch = zoom continuum on touch.
        const span = this.pinchSpan()
        if (span > 0) {
          this.distTarget = THREE.MathUtils.clamp(
            this.distTarget * (this.pinchDist / span),
            DIST_MIN,
            DIST_MAX
          )
          this.pinchDist = span
        }
        return
      }
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
    const endPointer = (e: PointerEvent): void => {
      this.pointers.delete(e.pointerId)
      if (this.pointers.size < 2) this.pinchDist = 0
      if (this.pointers.size === 0) this.pinched = false
      this.dragging = false
    }
    canvas.addEventListener('pointerup', (e) => {
      endPointer(e)
      const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY)
      if (moved < 8 && !this.flying && !this.pinched) {
        const hit = this.pick(e.clientX, e.clientY)
        if (hit) this.events.onDock(hit)
      }
    })
    canvas.addEventListener('pointercancel', endPointer)
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        if (this.flying) return
        // Exponential zoom: one notch feels identical at every scale.
        this.distTarget = THREE.MathUtils.clamp(
          this.distTarget * Math.exp(e.deltaY * 0.0011),
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
      this.distTarget = Math.min(this.distTarget, 32)
      this.events.onDock(bodyId)
      return
    }
    this.flying = true
    // If the pilot zoomed far out, the autopilot dives home during the flight.
    this.distTarget = Math.min(this.distTarget, 32)
    const from = { ...this.pointer }
    const to = { ...screen }
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.max(Math.hypot(dx, dy), 1)
    // Warp gate: only long hops jump to hyperspace — short hops keep the
    // dock-shake feel. Direction is the overall travel vector (UV y is up).
    const warpFlight = dist > 380
    const warpDirX = dx / dist
    const warpDirY = -dy / dist
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
      if (warpFlight) {
        // Punch in, cruise at full warp, drop out at the destination.
        const env = Math.min(1, Math.sin(Math.PI * t) * 1.7)
        this.ascii.setWarp(env, warpDirX, warpDirY)
        this.fovKick(env)
      }
      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        if (warpFlight) {
          this.ascii.setWarp(0, 0, 0)
          this.fovKick(0)
        }
        this.flying = false
        this.events.onDock(bodyId)
      }
    }
    requestAnimationFrame(step)
  }

  /** Warp speed sells through a brief FOV stretch (50° → 56° → 50°). */
  private fovKick(warp: number): void {
    const fov = 50 + warp * 6
    if (this.camera.fov !== fov) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
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

  /** Keyboard zoom (+/-). factor < 1 dives in, > 1 climbs out. */
  zoomBy(factor: number): void {
    this.distTarget = THREE.MathUtils.clamp(this.distTarget * factor, DIST_MIN, DIST_MAX)
  }

  private pinchSpan(): number {
    const pts = [...this.pointers.values()]
    return pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0
  }

  /** Close-range camera anchor: the hovered body, else the sun. */
  private focusBody(): Body | null {
    if (this.dist >= ORBITAL_ZONE) return null
    if (!this.hoveredId) return this.system.bodies.get('about') ?? null
    return (
      this.system.bodies.get(this.hoveredId) ??
      this.system.moons.get(this.hoveredId.replace('moon:', '')) ??
      this.system.bodies.get('about') ??
      null
    )
  }

  private applyCamera(): void {
    const sp = Math.sin(this.phi)
    CAM_OFFSET.set(
      this.dist * sp * Math.sin(this.theta),
      this.dist * Math.cos(this.phi),
      this.dist * sp * Math.cos(this.theta)
    )
    this.camera.position.copy(this.lookTarget).add(CAM_OFFSET)
    this.camera.lookAt(this.lookTarget)
  }

  private frame(dt: number, time: number): void {
    this.theta += (this.thetaTarget - this.theta) * Math.min(dt * 8, 1)
    this.phi += (this.phiTarget - this.phi) * Math.min(dt * 8, 1)
    this.dist += (this.distTarget - this.dist) * Math.min(dt * 6, 1)
    // Calm idle: slow drift when the pilot isn't steering.
    if (!this.reducedMotion && !this.dragging) this.thetaTarget += 0.012 * dt
    // Zoom continuum: at orbital range the camera parks on the locked body.
    const focus = this.focusBody()
    // Never enter a body's corona: hold ~3 radii clearance so close-ups frame
    // the body against space instead of drowning the frame in bright glyphs.
    if (focus) {
      const clearance = focus.mesh.geometry.boundingSphere!.radius * focus.mesh.scale.x * 3.1 + 0.4
      if (this.dist < clearance) this.dist = clearance
      if (this.distTarget < clearance) this.distTarget = clearance
    }
    const desired = focus ? focus.mesh.getWorldPosition(FOCUS_POS) : ORIGIN
    this.lookTarget.lerp(desired, Math.min(dt * 3.5, 1))
    this.applyCamera()
    this.system.setZoomView(this.dist)
    this.system.applyZoomFog(this.dist)
    const zone =
      this.dist < ORBITAL_ZONE ? 'ORBITAL' : this.dist < GALACTIC_ZONE ? 'SYSTEM' : 'GALACTIC'
    if (zone !== this.zone) {
      this.zone = zone
      this.events.onZone?.(zone)
    }
    if (!this.reducedMotion) this.system.update(dt)
    this.ascii.render(this.system.scene, this.camera, time)
  }
}


