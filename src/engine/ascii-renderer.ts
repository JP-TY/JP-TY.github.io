/**
 * GPU ASCII renderer.
 *
 * Pipeline:
 *   1. Render the 3D scene to a low-res WebGLRenderTarget
 *      (1 pixel per character cell, NearestFilter).
 *   2. Full-screen post pass: per cell, sample the scene color,
 *      map luminance -> glyph index on a VT323 font atlas,
 *      output the glyph tinted by the scene's phosphor color.
 *
 * This runs the whole solar system in one shader pass — the DOM is
 * never touched by scene rendering.
 */
import * as THREE from 'three'

/** Glyph ramp ordered low -> high visual density. */
const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

const ATLAS_COLS = 8
const ATLAS_ROWS = 8
const ATLAS_CELL = 64
const FONT = '48px VT323'

function buildAtlas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_COLS * ATLAS_CELL
  canvas.height = ATLAS_ROWS * ATLAS_CELL
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const count = Math.min(RAMP.length, ATLAS_COLS * ATLAS_ROWS)
  for (let i = 0; i < count; i++) {
    const cx = (i % ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL / 2
    const cy = Math.floor(i / ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL / 2 + 2
    ctx.fillText(RAMP[i], cx, cy)
  }
  return canvas
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tAtlas;
uniform vec2 uGrid;      // cols, rows
uniform float uRamp;     // glyph count
uniform float uTime;
uniform vec3 uVoid;      // background color

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 grid = uGrid;
  vec2 cell = floor(vUv * grid);
  vec2 cellUv = (cell + 0.5) / grid;

  vec3 scene = texture2D(tScene, cellUv).rgb;
  float lum = dot(scene, vec3(0.2126, 0.7152, 0.0722));

  // Map luminance to a glyph, with a little temporal jitter so
  // mid-tones shimmer like a dying CRT (noise only where content is).
  float t = clamp(lum * 2.0, 0.0, 0.9999);
  if (lum > 0.004) {
    float jitter = (hash(cell + floor(uTime * 8.0)) - 0.5) * 0.08;
    t = clamp(t + jitter, 0.0, 0.9999);
  }
  float idx = floor(t * uRamp);

  vec2 glyphCell = vec2(
    mod(idx, ${ATLAS_COLS}.0),
    floor(idx / ${ATLAS_COLS}.0)
  );
  // Sub-cell coordinates inside this character cell.
  vec2 sub = fract(vUv * grid);
  vec2 atlasUv = (glyphCell + sub) / vec2(${ATLAS_COLS}.0, ${ATLAS_ROWS}.0);
  float glyph = texture2D(tAtlas, atlasUv).r;

  // Phosphor boost: saturate + lift the scene color, quench the void.
  vec3 phosphor = pow(scene, vec3(0.75)) * 2.3;
  vec3 color = mix(uVoid, phosphor, glyph);

  // Gentle scanline inside each character cell.
  color *= 0.92 + 0.08 * step(0.5, fract(vUv.y * grid.y * 2.0));

  gl_FragColor = vec4(color, 1.0);
}
`

export class AsciiRenderer {
  readonly renderer: THREE.WebGLRenderer
  private sceneRT: THREE.WebGLRenderTarget
  private postScene: THREE.Scene
  private postCamera: THREE.OrthographicCamera
  private material: THREE.ShaderMaterial
  private cols = 1
  private rows = 1

  readonly cellW = 9
  readonly cellH = 16

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Font atlas (built immediately; rebuilt once webfonts load).
    const atlasTex = new THREE.CanvasTexture(buildAtlas())
    atlasTex.minFilter = THREE.LinearFilter
    atlasTex.magFilter = THREE.LinearFilter

    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    })

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tScene: { value: this.sceneRT.texture },
        tAtlas: { value: atlasTex },
        uGrid: { value: new THREE.Vector2(1, 1) },
        uRamp: { value: Math.min(RAMP.length, ATLAS_COLS * ATLAS_ROWS) },
        uTime: { value: 0 },
        uVoid: { value: new THREE.Color('#04060a') },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.postScene = new THREE.Scene()
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    quad.frustumCulled = false
    this.postScene.add(quad)

    this.resize()
  }

  /** Rebuild the atlas once VT323 has actually loaded. */
  refreshAtlas(): void {
    const tex = this.material.uniforms.tAtlas.value as THREE.Texture
    tex.image = buildAtlas()
    tex.needsUpdate = true
  }

  setSize(w: number, h: number): void {
    this.renderer.setSize(w, h, false)
    this.cols = Math.max(1, Math.ceil(w / this.cellW))
    this.rows = Math.max(1, Math.ceil(h / this.cellH))
    this.sceneRT.setSize(this.cols, this.rows)
    ;(this.material.uniforms.uGrid.value as THREE.Vector2).set(this.cols, this.rows)
  }

  resize(): void {
    this.setSize(window.innerWidth, window.innerHeight)
  }

  get grid(): { cols: number; rows: number } {
    return { cols: this.cols, rows: this.rows }
  }

  render(scene: THREE.Scene, camera: THREE.Camera, time: number): void {
    this.material.uniforms.uTime.value = time
    this.renderer.setRenderTarget(this.sceneRT)
    this.renderer.render(scene, camera)
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.postScene, this.postCamera)
  }

  dispose(): void {
    this.sceneRT.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }
}
