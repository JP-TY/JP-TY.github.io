/**
 * Solar system: the Sun (About) + 5 planets
 * (Projects, Experience, Achievements, Skills, Contact)
 * + 5 moons around the Projects planet (the CV's five projects).
 */
import * as THREE from 'three'
import type { ProjectContent } from '../data/content'

export interface Body {
  id: string
  label: string
  mesh: THREE.Mesh
  accent: string
  /** Set for moons */
  projectId?: string
}

interface PlanetConfig {
  id: string
  label: string
  accent: string
  orbitRadius: number
  radius: number
  speed: number
  phase: number
  tilt: number
  color: number
}

const PLANETS: PlanetConfig[] = [
  { id: 'projects',    label: 'PROJECTS',    accent: 'var(--cyan)',    orbitRadius: 9,  radius: 1.15, speed: 0.055, phase: 0.4, tilt: 0.02,  color: 0x38e1ff },
  { id: 'experience',  label: 'EXPERIENCE',  accent: 'var(--violet)',  orbitRadius: 13, radius: 0.95, speed: 0.038, phase: 2.4, tilt: -0.05, color: 0xa68bff },
  { id: 'achievements',label: 'ACHIEVEMENTS',accent: 'var(--amber)',   orbitRadius: 17, radius: 1.0,  speed: 0.03,  phase: 4.3, tilt: 0.06,  color: 0xffb000 },
  { id: 'skills',      label: 'SKILLS',      accent: 'var(--magenta)', orbitRadius: 21, radius: 0.85, speed: 0.022, phase: 5.4, tilt: -0.03, color: 0xff5fd2 },
  { id: 'contact',     label: 'CONTACT',     accent: 'var(--orange)',  orbitRadius: 25, radius: 0.75, speed: 0.016, phase: 1.6, tilt: 0.04,  color: 0xff8a3d },
]

export class SolarSystem {
  readonly scene = new THREE.Scene()
  readonly raycastTargets: THREE.Object3D[] = []
  readonly bodies = new Map<string, Body>()
  /** Moons keyed by project id */
  readonly moons = new Map<string, Body>()

  private planetGroups: { group: THREE.Group; cfg: PlanetConfig; angle: number }[] = []
  private moonGroups: { group: THREE.Group; projectId: string; angle: number }[] = []
  private stars: THREE.Points[] = []
  private sun: THREE.Mesh
  private reducedMotion: boolean
  private highlightId: string | null = null
  private everyBody: Body[] = []

  constructor(reducedMotion: boolean, projects: ProjectContent[]) {
    this.reducedMotion = reducedMotion
    this.scene.fog = new THREE.Fog(0x04060a, 45, 120)
    this.scene.background = new THREE.Color(0x04060a)

    // Lighting: sun at center + faint ambient so far sides aren't pure black.
    this.scene.add(new THREE.PointLight(0xbfffe0, 3200, 120, 1.4))
    this.scene.add(new THREE.AmbientLight(0x30485a, 2.4))

    // Sun (About) — the green phosphor heart, shaded so it reads as a sphere.
    const sunGeo = new THREE.SphereGeometry(2.6, 24, 24)
    const sunMat = new THREE.MeshLambertMaterial({
      color: 0x1f9958,
      emissive: 0x3dff8f,
      emissiveIntensity: 0.9,
    })
    this.sun = new THREE.Mesh(sunGeo, sunMat)
    this.sun.userData.bodyId = 'about'
    this.scene.add(this.sun)
    this.raycastTargets.push(this.sun)
    this.bodies.set('about', { id: 'about', label: 'ABOUT', mesh: this.sun, accent: 'var(--green)' })

    // Planets.
    const geo = new THREE.SphereGeometry(1, 24, 24)
    for (const cfg of PLANETS) {
      const mat = new THREE.MeshLambertMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0, // rises on hover — the body answers the lock
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.scale.setScalar(cfg.radius)
      mesh.userData.bodyId = cfg.id

      const arm = new THREE.Group()
      arm.rotation.x = cfg.tilt
      arm.add(mesh)
      this.scene.add(arm)

      this.planetGroups.push({ group: arm, cfg, angle: cfg.phase })
      this.raycastTargets.push(mesh)
      this.bodies.set(cfg.id, { id: cfg.id, label: cfg.label, mesh, accent: cfg.accent })

      // Orbit ring guide (barely visible cartography).
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.orbitRadius, 0.008, 6, 128),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.28 })
      )
      ring.rotation.x = Math.PI / 2
      this.scene.add(ring)
    }

    // Five moons around the Projects planet.
    const moonGeo = new THREE.SphereGeometry(0.16, 10, 10)
    projects.forEach((p, i) => {
      const mesh = new THREE.Mesh(
        moonGeo,
        new THREE.MeshLambertMaterial({ color: 0xbfeeff, emissive: 0xbfeeff, emissiveIntensity: 0 })
      )
      mesh.userData.bodyId = `moon:${p.id}`
      const arm = new THREE.Group()
      arm.rotation.x = 0.35 + i * 0.12
      arm.add(mesh)
      this.scene.add(arm)
      this.moonGroups.push({ group: arm, projectId: p.id, angle: (i / projects.length) * Math.PI * 2 })
      this.raycastTargets.push(mesh)
      this.moons.set(p.id, {
        id: `moon:${p.id}`,
        label: p.name.toUpperCase(),
        mesh,
        accent: 'var(--cyan)',
        projectId: p.id,
      })
    })

    // Starfields: two parallax layers of drifting glyph-grain.
    for (const [count, spread, size] of [[420, 60, 0.09], [260, 38, 0.14]] as const) {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = spread * (0.6 + Math.random() * 0.4)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.cos(phi) * 0.6
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const pts = new THREE.Points(
        g,
        new THREE.PointsMaterial({ color: 0x6b8ba0, size, sizeAttenuation: true })
      )
      this.scene.add(pts)
      this.stars.push(pts)
    }

    if (reducedMotion) this.update(0) // park bodies at their phases
    this.everyBody = [...this.bodies.values(), ...this.moons.values()]
  }

  /** Advance orbits. dt in seconds. */
  update(dt: number): void {
    for (const p of this.planetGroups) {
      p.angle += p.cfg.speed * dt
      p.group.position.set(
        Math.cos(p.angle) * p.cfg.orbitRadius,
        0,
        Math.sin(p.angle) * p.cfg.orbitRadius
      )
    }
    for (const m of this.moonGroups) {
      m.angle += 0.6 * dt
      m.group.position.set(Math.cos(m.angle) * 2.1, 0, Math.sin(m.angle) * 2.1)
    }
    for (const s of this.stars) s.rotation.y += 0.004 * dt
    this.applyGlow(Math.min(dt * 8, 1))
  }

  /** Hover feedback: the locked body itself answers with an emissive rise. */
  setHighlighted(id: string | null): void {
    this.highlightId = id
    if (this.reducedMotion) this.applyGlow(1) // update() is parked in reduced motion
  }

  private applyGlow(blend: number): void {
    for (const body of this.everyBody) {
      const mat = body.mesh.material as THREE.MeshLambertMaterial
      const base = body.id === 'about' ? 0.9 : 0
      const hovered = body.id === this.highlightId
      const target = hovered ? (body.id === 'about' ? 1.5 : 0.55) : base
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * blend
    }
  }

  /** Sun world position (About body). */
  get sunPosition(): THREE.Vector3 {
    return this.sun.position
  }

  /** Screen-space position of a body, or null if behind camera. */
  screenPosition(bodyId: string, camera: THREE.Camera): { x: number; y: number } | null {
    const body = this.bodies.get(bodyId) ?? this.moons.get(bodyId.replace('moon:', ''))
    if (!body) return null
    const pos = body.mesh.getWorldPosition(new THREE.Vector3())
    const projected = pos.clone().project(camera)
    if (projected.z > 1) return null
    return {
      x: ((projected.x + 1) / 2) * window.innerWidth,
      y: ((1 - projected.y) / 2) * window.innerHeight,
    }
  }
}


