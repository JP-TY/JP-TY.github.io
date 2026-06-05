/**
 * James Ty Portfolio — orchestrator. Title screen, hash router, command menu,
 * section documents, stat counters, sound toggle, keyboard shortcuts.
 */

import './styles/main.css'
import { animate } from 'animejs'
import { parseHash, Router } from './engine/router'
import { startMotes } from './engine/motes'
import { isSoundEnabled, setSoundEnabled, sfx } from './engine/audio'
import { Boot } from './ui/boot'
import { Menu } from './ui/menu'
import { renderSection } from './ui/panel-content'
import { prefersReducedMotion, revealHub, revealView, wipeTransition, exitHub, exitView } from './ui/transitions'
import { sections, projects, achievements, certifications } from './data/content'

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)

const STATS: Record<string, number> = {
  projects: projects.length,
  awards: achievements.length,
  certs: certifications.length,
}

let router!: Router
let menu!: Menu
let booted = false
let currentSection: string | null = null
/** Coalesce navigation: never let a second blade start mid-cut. */
let navigating = false

function initSoundToggle() {
  const btn = $('#sound-toggle')!
  const sync = () => {
    btn.textContent = isSoundEnabled() ? '[ SOUND: ON ]' : '[ SOUND: OFF ]'
    btn.setAttribute('aria-pressed', String(isSoundEnabled()))
  }
  btn.addEventListener('click', () => {
    setSoundEnabled(!isSoundEnabled())
    sync()
    sfx.confirm()
  })
  sync()
}

function animateStats() {
  document.querySelectorAll<HTMLElement>('.stat-num').forEach((n, i) => {
    const target = STATS[n.dataset.stat ?? ''] ?? 0
    if (prefersReducedMotion()) {
      n.textContent = String(target)
      return
    }
    const obj = { v: 0 }
    animate(obj, {
      v: target,
      duration: 1100,
      ease: 'outExpo',
      delay: 600 + i * 120,
      onUpdate: () => {
        n.textContent = String(Math.round(obj.v))
      },
    })
  })
}

function enterHub() {
  $('#app')!.hidden = false
  $('#hub')!.hidden = false
  $('#view')!.hidden = true
  $('#chrome')!.hidden = false
  // The command menu re-slams in on EVERY arrival — Persona/Metaphor replay
  // their menu entrance each time it opens, and replaying keeps the hub
  // visible after exitHub() faded it out for the blade.
  revealHub()
  animateStats()
  // Keyboard users start on command 01.
  menu.focusFirst()
}

/** Blade-cut into a section document. Coalesced; instant under reduced motion. */
async function openSection(id: string) {
  const sec = sections.find((s) => s.id === id)
  if (!sec || navigating || currentSection === id) return
  navigating = true
  sfx.open()
  if (prefersReducedMotion()) {
    $('#app')!.hidden = false
    $('#chrome')!.hidden = false
    $('#hub')!.hidden = true
    $('#view')!.hidden = false
    setViewContent(id, sec)
    $('#view-body')!.focus({ preventScroll: true })
    navigating = false
    return
  }
  exitHub()
  await wipeTransition(
    () => {
      // Swapping under cover: release the nav lock the instant the new scene
      // exists, so Escape / links are honoured while the blade is still out.
      $('#app')!.hidden = false
      $('#chrome')!.hidden = false
      $('#hub')!.hidden = true
      $('#view')!.hidden = false
      setViewContent(id, sec)
      revealView()
      $('#view-body')!.focus({ preventScroll: true })
      navigating = false
    },
    { title: sec.title, kicker: 'SECTION 0' + (sections.indexOf(sec) + 1) },
  )
}

/** Blade-cut back to the command menu. */
async function closeSection() {
  if (currentSection === null || navigating) return
  navigating = true
  sfx.cancel()
  if (prefersReducedMotion()) {
    $('#view')!.hidden = true
    $('#hub')!.hidden = false
    currentSection = null
    menu.focusFirst()
    navigating = false
    return
  }
  exitView()
  await wipeTransition(
    () => {
      $('#view')!.hidden = true
      $('#hub')!.hidden = false
      currentSection = null
      navigating = false
      // Start the menu slam UNDER the blade so it's already mid-entrance
      // as the cut uncovers the hub — never an empty beat.
      revealHub()
      animateStats()
      menu.focusFirst()
    },
    { title: 'COMMAND', kicker: 'MENU' },
  )
}

function handleRoute(id: string) {
  if (id === 'title') {
    // The title screen owns the session until advanced; afterwards '' means menu.
    if (booted) router.go('menu')
    return
  }
  if (!booted) return
  if (id === 'menu') {
    if (currentSection !== null) void closeSection()
    else enterHub()
  } else {
    void openSection(id)
  }
}

/** Populate the document frame for `id` and reset the reveal choreography. */
function setViewContent(id: string, sec: (typeof sections)[number]) {
  $('#view-kicker')!.textContent = sec.title
  $('#view-intro')!.textContent = sec.intro
  $('#view-heading')!.textContent = sec.heading
  $('#view-watermark')!.textContent = sec.heading.split(' ')[0].toUpperCase()
  const body = $('#view-body')!
  body.innerHTML = ''
  renderSection(id, body)
  currentSection = id
}

function init() {
  startMotes($('#motes')!)
  initSoundToggle()

  // Gate the boot slam on Cinzel being ready so letters never flash a fallback face.
  const start = () => void startSession()
  if (document.fonts?.ready) void document.fonts.ready.then(start)
  else start()
}

function startSession() {
  if (booted) return
  menu = new Menu((id) => router.go(id))
  menu.render()

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentSection !== null && !navigating) void closeSection()
  })

  router = new Router(handleRoute)
  const initial = parseHash()
  const deepLinked = initial !== 'menu' && initial !== 'title'

  if (Boot.wasBooted() || deepLinked) {
    // Returning visitor, or a recruiter landing straight on a section:
    // skip the ceremony entirely.
    booted = true
    new Boot(() => {}).skipInstant()
    router.start()
    if (parseHash() === 'title') router.go('menu')
  } else {
    router.start()
    const boot = new Boot(() => {
      booted = true
      // Re-dispatch the current route: `go('menu')` alone would be deduped
      // when the visitor already sits on #/menu (deep link straight to hub).
      handleRoute(parseHash())
    })
    void boot.run()
  }
}

init()
