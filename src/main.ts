/**
 * TY.STELLAR — entry point.
 * Wires boot sequence, ASCII scene, rocket cursor, panels, HUD,
 * sound, classic mode, and the easter egg.
 */
import './styles/main.css'
import { SceneController } from './engine/scene-controller'
import { SolarSystem } from './engine/solar-system'
import { Rocket } from './engine/rocket'
import { BootSequence } from './ui/boot'
import { Hud } from './ui/hud'
import { PanelController } from './ui/panels'
import { buildPanels, sectionById } from './ui/panel-content'
import { Sound } from './ui/sound'
import { buildClassic } from './ui/classic'
import { projects } from './data/content'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const touch = window.matchMedia('(pointer: coarse)').matches
if (touch) document.body.classList.add('touch')
if (reducedMotion) document.body.classList.add('reduced-motion')

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

function enterClassic(): void {
  document.body.classList.add('classic')
  const classic = document.getElementById('classic') as HTMLElement
  classic.hidden = false
}

function boot(): void {
  const sound = new Sound()
  const bootSeq = new BootSequence(reducedMotion)

  // --- WebGL capability gate: no GL, no theater — classic mode. ---
  if (!webglAvailable()) {
    buildClassic(
      document.getElementById('classic') as HTMLElement,
      () => window.location.reload()
    )
    enterClassic()
    return
  }

  const system = new SolarSystem(reducedMotion, projects)
  // Panels, HUD, and the solar system all read the same content.ts.
  const panelsRoot = document.getElementById('panels') as HTMLElement
  const panelEls = buildPanels(panelsRoot)

  const hud = new Hud((id) => flyTo(id), sound)
  const panels = new PanelController(panelEls, reducedMotion, {
    onOpen(id) {
      rocket.setParked(true)
      hud.setActive(id)
      const section = sectionById(id)
      if (section) hud.setTarget(`DOCKED: ${section.label}`, `var(${section.accentVar})`)
      hud.playFlavor(id)
      sound.dock()
      if (id === 'projects' && panels.pendingProject) hud.message(`dossier: ${panels.pendingProject}`)
    },
    onClose() {
      rocket.setParked(false)
      hud.setActive(null)
      hud.idle()
      sound.undock()
    },
  })

  const canvas = document.getElementById('space') as HTMLCanvasElement
  const scene = new SceneController(canvas, system, reducedMotion, {
    onHover(body) {
      if (panels.isOpen) return
      if (body) {
        hud.setTarget(`LOCK: ${body.label}`, body.accent)
        rocket.setLocked(true, body.accent)
        sound.hover()
      } else {
        hud.setTarget(null)
        rocket.setLocked(false)
      }
    },
    onDock(bodyId) {
      const id = bodyId.startsWith('moon:') ? 'projects' : bodyId
      if (bodyId.startsWith('moon:')) panels.pendingProject = bodyId.slice(5)
      panels.open(id)
    },
  })

  const rocket = new Rocket(scene, reducedMotion, touch)

  // Autopilot from the nav strip.
  function flyTo(id: string): void {
    if (panels.current === id) return
    if (panels.isOpen) panels.close()
    scene.flyTo(id)
  }

  // HUD coordinates follow the virtual pointer (throttled by rAF cadence).
  let lastCoords = 0
  window.addEventListener(
    'pointermove',
    (e) => {
      const now = performance.now()
      if (now - lastCoords > 90) {
        lastCoords = now
        hud.setCoords(e.clientX, e.clientY)
      }
    },
    { passive: true }
  )

  // Sound toggle.
  const soundBtn = document.getElementById('toggle-sound') as HTMLButtonElement
  soundBtn.addEventListener('click', () => {
    const on = sound.toggle()
    soundBtn.textContent = `[ SOUND: ${on ? 'ON' : 'OFF'} ]`
    soundBtn.setAttribute('aria-pressed', String(on))
  })

  // Classic mode toggle.
  const classicBtn = document.getElementById('toggle-classic') as HTMLButtonElement
  const classicRoot = document.getElementById('classic') as HTMLElement
  let classicBuilt = false
  classicBtn.addEventListener('click', () => {
    const on = !document.body.classList.contains('classic')
    document.body.classList.toggle('classic', on)
    classicBtn.setAttribute('aria-pressed', String(on))
    if (on) {
      if (!classicBuilt) {
        buildClassic(classicRoot, () => {
          document.body.classList.remove('classic')
          classicRoot.hidden = true
          classicBtn.setAttribute('aria-pressed', 'false')
          classicBtn.focus()
        })
        classicBuilt = true
      }
      classicRoot.hidden = false
      if (panels.isOpen) panels.close()
    } else {
      classicRoot.hidden = true
    }
  })

  // Keyboard: 1–6 dock to bodies from anywhere.
  const keyMap: Record<string, string> = {
    '1': 'about',
    '2': 'projects',
    '3': 'experience',
    '4': 'achievements',
    '5': 'skills',
    '6': 'contact',
  }
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    const id = keyMap[e.key]
    if (id && !panels.isOpen && !document.body.classList.contains('classic')) {
      flyTo(id)
    }
  })

  // Easter egg: the classic konami code. Because a terminal owes you one.
  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
  ]
  let konamiIndex = 0
  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIndex]) {
      konamiIndex++
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0
        hud.message('CHEAT ACCEPTED: WAFERS, PLEASE! unlocked 🧇 — you absolute legend.')
      }
    } else {
      konamiIndex = e.key === KONAMI[0] ? 1 : 0
    }
  })

  // Reveal HUD once boot hands over.
  bootSeq.done.then(() => hud.reveal())
}

boot()
