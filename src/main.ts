import './styles/main.css'
import { counts, sections } from './data/content'
import { currentRoute, navigate, onRouteChange } from './engine/router'
import type { RouteId } from './engine/router'
import { blip, isSoundOn, setSound } from './engine/audio'
import { startMotes } from './engine/motes'
import { startFavicon } from './engine/favicon'
import { startDream } from './engine/dream'
import { runBoot } from './ui/boot'
import { renderGrandMenu } from './ui/menu'
import { renderBody } from './ui/panel-content'
import { coalesce, veilTo } from './ui/transitions'

function animateCounts(root: ParentNode = document): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const targets: Record<string, number> = {
    projects: counts.projects,
    roles: counts.roles,
    certs: counts.certs,
    awards: counts.awards,
  }
  root.querySelectorAll<HTMLElement>('[data-stat]').forEach((node) => {
    const key = node.dataset.stat ?? ''
    const end = targets[key] ?? 0
    if (reduced) {
      node.textContent = String(end)
      return
    }
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 700, 1)
      node.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

function paint(route: Exclude<RouteId, 'menu'>): void {
  const meta = sections.find((s) => s.id === route) ?? sections[0]
  document.getElementById('page-screen')?.classList.toggle('route-skills', route === 'skills')
  const kicker = document.getElementById('view-kicker')
  const heading = document.getElementById('view-heading')
  const intro = document.getElementById('view-intro')
  const body = document.getElementById('view-body')
  if (!kicker || !heading || !intro || !body) return
  kicker.textContent = meta.kicker
  heading.textContent = meta.heading
  intro.textContent = meta.intro
  intro.hidden = route === 'recognition' || route === 'profile' || route === 'skills'
  body.innerHTML = ''
  body.appendChild(renderBody(route))
  animateCounts(body)
}

const dreamHover: { index: number | null } = { index: null }
let dreamStop: () => void = () => undefined
let menuBuilt = false

/** Move the roving focus through the index rows (left/right & up/down). */
function moveNavFocus(step: 1 | -1): void {
  const rows = [...document.querySelectorAll<HTMLButtonElement>('.grand-row')]
  if (rows.length === 0) return
  const cur = rows.findIndex((r) => r.tabIndex === 0)
  const next =
    cur === -1
      ? step === 1
        ? 0
        : rows.length - 1
      : (cur + step + rows.length) % rows.length
  rows.forEach((r) => (r.tabIndex = -1))
  rows[next].tabIndex = 0
  rows[next].focus({ preventScroll: true })
}

/** Step to the previous/next section from inside any page. */
function stepSection(step: 1 | -1): void {
  const ids = sections.map((s) => s.id as RouteId)
  const cur = ids.indexOf(currentRoute())
  const next = ids[(((cur < 0 ? 0 : cur) + step) % ids.length + ids.length) % ids.length]
  blip(600, 50)
  navigate(next)
}

function wireKeys(): void {
  document.addEventListener('keydown', (e) => {
    const app = document.getElementById('app')
    if (!app || app.hidden) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const target = e.target as HTMLElement | null
    if (target?.closest?.('input, textarea, select')) return
    // Open dialogs own the keyboard entirely.
    if (document.querySelector('.honor-pop')) return
    const screen = document.getElementById('menu-screen')
    const inMenu = !!screen && !screen.hidden
    // digits quick-travel to sections from anywhere; rows handle their
    // own keys, so skip events from inside the menu
    if (/^[1-6]$/.test(e.key)) {
      if (target?.closest?.('.grand-menu')) return
      e.preventDefault()
      const rows = [...document.querySelectorAll<HTMLButtonElement>('.grand-row')]
      rows[Number(e.key) - 1]?.click()
      return
    }
    // [ and ] walk sections in order from any page.
    if (e.key === '[' || e.key === ']') {
      if (target?.closest?.('.grand-menu')) return
      e.preventDefault()
      stepSection(e.key === ']' ? 1 : -1)
      return
    }
    if (!inMenu) return
    // In the menu, arrows hop the index and Enter/Space lands the lit row.
    const hop: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    const step = hop[e.key]
    if (step !== undefined) {
      if (target?.closest?.('.grand-menu, a[href]')) return
      e.preventDefault()
      moveNavFocus(step as 1 | -1)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (target?.closest?.('button, a, input, textarea')) return
      const lit = dreamHover.index !== null ? sections[dreamHover.index] : undefined
      if (lit) {
        e.preventDefault()
        navigate(lit.id as RouteId)
      }
    }
  })
}

function showMenu(focusFirst: boolean): void {
  const menu = document.getElementById('menu-screen')
  const page = document.getElementById('page-screen')
  if (page) page.hidden = true
  if (menu) {
    menu.hidden = false
    dreamStop()
    const canvas = document.getElementById('dream') as HTMLCanvasElement | null
    if (canvas) {
      dreamStop = startDream(
        canvas,
        dreamHover,
        sections.map((s) => s.label),
        (i) => {
          const target = sections[i]
          if (target) navigate(target.id as RouteId)
        },
      )
    }
    animateCounts(menu)
  }
  if (focusFirst) {
    document.querySelector<HTMLButtonElement>('.grand-row')?.focus({ preventScroll: true })
  }
  document.getElementById('view-body')?.blur?.()
}

function showPage(route: Exclude<RouteId, 'menu'>): void {
  const menu = document.getElementById('menu-screen')
  const page = document.getElementById('page-screen')
  dreamStop()
  if (menu) menu.hidden = true
  if (page) page.hidden = false
  paint(route)
  animateCounts(document)
  document.getElementById('view-body')?.focus({ preventScroll: true })
}

function routeTo(route: RouteId, focusMenu: boolean): void {
  const meta = sections.find((s) => s.id === route)
  if (route === 'menu' || !meta) {
    const label = { kicker: 'TY.OS', title: 'Index' }
    coalesce(() => veilTo(label, () => showMenu(focusMenu)))
    return
  }
  coalesce(() => veilTo({ kicker: meta.kicker, title: meta.heading }, () => showPage(route)))
}

function showApp(initial: RouteId): void {
  const save = document.getElementById('save')
  const app = document.getElementById('app')
  if (save) save.hidden = true
  if (app) app.hidden = false
  if (!menuBuilt) {
    menuBuilt = true
    renderGrandMenu({
      hover: dreamHover,
      onSelect: (r) => navigate(r),
    })
    wireKeys()
    document.getElementById('page-back')?.addEventListener('click', () => {
      blip(520, 60)
      navigate('menu')
    })
  }
  if (initial === 'menu') showMenu(false)
  else showPage(initial)
  animateCounts(document)
}

function main(): void {
  startFavicon()
  startMotes(document.getElementById('motes') as HTMLCanvasElement)

  const toggle = document.getElementById('sound-toggle') as HTMLButtonElement | null
  toggle?.addEventListener('click', () => {
    const next = !isSoundOn()
    setSound(next)
    toggle.setAttribute('aria-pressed', String(next))
    toggle.textContent = next ? '[ SOUND: ON ]' : '[ SOUND: OFF ]'
    blip(700, 50)
  })

  onRouteChange((route) => {
    const app = document.getElementById('app')
    if (!app || app.hidden) return
    routeTo(route, true)
  })

  document.addEventListener('keydown', (e) => {
    const page = document.getElementById('page-screen')
    if (e.key === 'Escape' && page && !page.hidden) {
      navigate('menu')
    }
  })

  runBoot(() => {
    const boot = document.getElementById('boot')
    const save = document.getElementById('save')
    if (boot) boot.hidden = true
    if (save) {
      save.hidden = false
      animateCounts(save)
      const slot = document.getElementById('slot-1') as HTMLButtonElement | null
      slot?.focus({ preventScroll: true })
      let entered = false
      const enter = () => {
        if (entered) return
        entered = true
        blip(520, 70)
        showApp(currentRoute())
      }
      slot?.addEventListener('click', enter)
      if (window.location.hash && window.location.hash !== '#/') {
        enter()
      }
    }
  })
}

main()
