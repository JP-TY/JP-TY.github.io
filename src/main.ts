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
    systems: counts.systems,
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
  body.innerHTML = ''
  body.appendChild(renderBody(route))
  animateCounts(body)
}

const dreamHover: { index: number | null } = { index: null }
let dreamStop: () => void = () => undefined
let menuBuilt = false

function setDrawer(open: boolean, focusRow: boolean): void {
  const screen = document.getElementById('menu-screen')
  const drawer = document.getElementById('menu-drawer')
  const tab = document.getElementById('menu-tab') as HTMLButtonElement | null
  if (!screen || !drawer || !tab) return
  screen.classList.toggle('drawer-open', open)
  tab.setAttribute('aria-expanded', String(open))
  if (open) {
    drawer.removeAttribute('inert')
    if (focusRow) document.querySelector<HTMLButtonElement>('.grand-row')?.focus({ preventScroll: true })
  } else {
    drawer.setAttribute('inert', '')
  }
}

function wireDrawer(): void {
  const screen = document.getElementById('menu-screen')
  const dock = document.getElementById('menu-dock')
  const tab = document.getElementById('menu-tab') as HTMLButtonElement | null
  if (!screen || !dock || !tab) return
  tab.addEventListener('click', () => {
    const willOpen = !screen.classList.contains('drawer-open')
    setDrawer(willOpen, willOpen)
  })
  tab.addEventListener('mouseenter', () => setDrawer(true, false))
  dock.addEventListener('mouseleave', () => setDrawer(false, false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && screen.classList.contains('drawer-open')) {
      setDrawer(false, false)
      tab.focus({ preventScroll: true })
    }
  })
  // Game controls, app-wide: digits quick-travel to pages (rows handle
  // their own keys, so skip events from inside the drawer), arrows hop
  // the lit planet across the solar system with Enter/Space to land,
  // I toggles the index drawer while the menu is up.
  document.addEventListener('keydown', (e) => {
    const app = document.getElementById('app')
    if (!app || app.hidden) return
    const target = e.target as HTMLElement | null
    if (/^[1-6]$/.test(e.key)) {
      if (target?.closest?.('.grand-menu')) return
      e.preventDefault()
      const rows = [...document.querySelectorAll<HTMLButtonElement>('.grand-row')]
      rows[Number(e.key) - 1]?.click()
      return
    }
    const hop: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    const step = hop[e.key]
    if (step !== undefined && !screen.hidden) {
      if (target?.closest?.('.grand-menu')) return
      e.preventDefault()
      const n = sections.length
      dreamHover.index = ((dreamHover.index ?? -1) + step + n) % n
      return
    }
    if ((e.key === 'Enter' || e.key === ' ') && !screen.hidden) {
      if (target?.closest?.('button, a, input, textarea')) return
      const lit = dreamHover.index !== null ? sections[dreamHover.index] : undefined
      if (lit) {
        e.preventDefault()
        navigate(lit.id as RouteId)
      }
      return
    }
    if ((e.key === 'i' || e.key === 'I') && !screen.hidden) {
      if (target?.closest?.('input, textarea')) return
      const willOpen = !screen.classList.contains('drawer-open')
      setDrawer(willOpen, willOpen)
    }
  })
}

function showMenu(focusFirst: boolean): void {
  const menu = document.getElementById('menu-screen')
  const page = document.getElementById('page-screen')
  if (page) page.hidden = true
  setDrawer(false, false)
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
    setDrawer(false, false)
    document.getElementById('menu-tab')?.focus({ preventScroll: true })
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
    wireDrawer()
    document.getElementById('page-back')?.addEventListener('click', () => {
      blip(520, 60)
      navigate('menu')
    })
  }
  setDrawer(false, false)
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
