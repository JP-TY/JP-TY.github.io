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

/** Per-planet surface character for the close-up LOD. */
const PLANET_SURF: Record<string, { bands: number; bandAmt: number; seed: number }> = {
  projects:     { bands: 8.0, bandAmt: 0.7,  seed: 1.7 },  // cyan gas giant — strong bands
  experience:   { bands: 4.0, bandAmt: 0.25, seed: 4.2 },  // violet terrestrial — mottled
  achievements: { bands: 6.5, bandAmt: 0.45, seed: 7.9 },  // amber desert world
  skills:       { bands: 5.0, bandAmt: 0.3,  seed: 11.3 }, // magenta mottle
  contact:      { bands: 3.5, bandAmt: 0.2,  seed: 15.8 }, // orange rock
}

/** Hash → value noise → fbm. Prefixed to avoid collisions in Lambert chunks. */
const NOISE_GLSL = /* glsl */ `
  vec3 jhash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
    p *= 17.0;
    return fract(vec3(p.x * p.y * (p.x + p.y), p.y * p.z * (p.y + p.z), p.z * p.x * (p.z + p.x)));
  }
  float jnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(jhash3(i).x, jhash3(i + vec3(1,0,0)).x, f.x),
          mix(jhash3(i + vec3(0,1,0)).x, jhash3(i + vec3(1,1,0)).x, f.x), f.y),
      mix(mix(jhash3(i + vec3(0,0,1)).x, jhash3(i + vec3(1,0,1)).x, f.x),
          mix(jhash3(i + vec3(0,1,1)).x, jhash3(i + vec3(1,1,1)).x, f.x), f.y), f.z);
  }
  float jfbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * jnoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
`

/**
 * Inject procedural surface detail into a Lambert planet material via
 * onBeforeCompile. Luminance-only modulation: bands + mottle change glyph
 * density through the ASCII ramp without fighting the accent palette.
 * Hover glow (emissiveIntensity) keeps working — untouched channel.
 */
function addSurfaceDetail(
  mat: THREE.MeshLambertMaterial,
  surf: { bands: number; bandAmt: number; seed: number }
): void {
  // Distinct cache key per surface, or three.js shares the first compiled program.
  mat.customProgramCacheKey = () => `surf:${surf.bands}:${surf.bandAmt}:${surf.seed}`
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSurfPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfPos = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSurfPos;\n' + NOISE_GLSL)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  {
    vec3 sp = vSurfPos * 2.2 + vec3(${surf.seed.toFixed(2)});
    float band = sin(vSurfPos.y * ${(surf.bands * 2).toFixed(1)} + jfbm(sp) * 2.4) * 0.5 + 0.5;
    float mot = jfbm(sp * 1.9);
    diffuseColor.rgb *= mix(0.6, 1.3, band * ${surf.bandAmt.toFixed(2)} + mot * ${(1 - surf.bandAmt).toFixed(2)});
  }`
      )
  }
}

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
  private galaxy!: THREE.Points
  private galaxyMat!: THREE.PointsMaterial
  private sunTime = { value: 0 }

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
    // Close-up LOD: fbm granulation churns through the emissive channel —
    // the sun's surface boils when you approach it.
    sunMat.customProgramCacheKey = () => 'sun-granulation'
    sunMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunTime = this.sunTime
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSurfPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfPos = position;')
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vSurfPos;\nuniform float uSunTime;\n' + NOISE_GLSL
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
  totalEmissiveRadiance *= 0.7 + 0.55 * jfbm(vSurfPos * 3.2 + vec3(uSunTime * 0.07));`
        )
    }
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
      addSurfaceDetail(mat, PLANET_SURF[cfg.id] ?? { bands: 5, bandAmt: 0.3, seed: 3.1 })
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

    this.buildGalaxy()

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
    this.galaxy.rotation.y += 0.005 * dt
    this.sunTime.value = (this.sunTime.value + dt) % 3600
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

  /**
   * The galactic layer: ~9k stars in two logarithmic spiral arms + a warm
   * core bulge, in the same xz-plane as the system (the camera's pitch
   * supplies the tilt). Accent-colored "stellar classes" echo the planet
   * palette. Additive + fog-exempt so it reads at any range.
   */
  private buildGalaxy(): void {
    const COUNT = 9000
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const accents = [0x38e1ff, 0xa68bff, 0xffb000, 0xff5fd2, 0xff8a3d, 0x3dff8f].map(
      (c) => new THREE.Color(c)
    )
    const white = new THREE.Color(0xaad0e2)
    const coreC = new THREE.Color(0xd8ffe4)
    const tmp = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      let x: number, y: number, z: number
      if (i < COUNT * 0.16) {
        // Central bulge — the system lives inside its glow.
        const rr = Math.pow(Math.random(), 1.7) * 85
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        x = rr * Math.sin(ph) * Math.cos(th)
        z = rr * Math.sin(ph) * Math.sin(th)
        y = rr * Math.cos(ph) * 0.72
      } else {
        const r = 34 + Math.pow(Math.random(), 0.62) * 390
        const arm = i % 2
        const ang =
          arm * Math.PI + r * 0.0165 + (Math.random() - 0.5) * (0.3 + (r / 400) * 0.55)
        const thick = 7 + 30 * Math.exp(-r / 150)
        y = ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * thick
        x = Math.cos(ang) * r
        z = Math.sin(ang) * r
      }
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      const rr = Math.hypot(x, z)
      if (rr < 85) tmp.copy(coreC)
      else if (Math.random() < 0.09) tmp.copy(accents[i % accents.length])
      else tmp.copy(white).lerp(coreC, Math.max(0, 1 - rr / 260) * 0.45)
      const b = 0.5 + 0.5 * Math.max(0, 1 - rr / 440)
      col[i * 3] = tmp.r * b
      col[i * 3 + 1] = tmp.g * b
      col[i * 3 + 2] = tmp.b * b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    this.galaxyMat = new THREE.PointsMaterial({
      size: 2.3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
    this.galaxy = new THREE.Points(geo, this.galaxyMat)
    this.scene.add(this.galaxy)
  }

  /**
   * Zoom continuum — galactic layer. The spiral-arm point cloud fades in as
   * the camera pulls past the system (dist ≈ 110 → 300). The ASCII post
   * shader renders it for free: additive glyph-grain, fog-exempt.
   */
  setZoomView(dist: number): void {
    const t = THREE.MathUtils.clamp((dist - 110) / 190, 0, 1)
    const s = t * t * (3 - 2 * t)
    this.galaxyMat.opacity = s * 0.85
  }

  /** Zoom-scaled fog so the system never snaps out of existence at far range. */
  applyZoomFog(dist: number): void {
    const fog = this.scene.fog as THREE.Fog
    const k = Math.max(1, dist / 30)
    fog.near = 45 * k
    fog.far = 120 * k
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


