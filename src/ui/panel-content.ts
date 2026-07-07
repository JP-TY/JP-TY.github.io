import {
  awards,
  branches,
  certifications,
  profile,
  systems,
  timeline,
} from '../data/content'
import type { RouteId } from '../engine/router'
import { blip } from '../engine/audio'
import { startPortrait } from '../engine/portrait'
import { startStardust } from '../engine/stardust'
import {
  Activity,
  BookOpen,
  Boxes,
  Brain,
  Cpu,
  Cloud,
  CloudCog,
  Cloudy,
  Code,
  Container,
  Database,
  Eye,
  FileCode,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  Hash,
  Layers,
  Network,
  RefreshCcw,
  Server,
  Ship,
  Terminal,
  Workflow,
  Zap,
} from 'lucide'
import { startConstellation } from '../engine/constellation'
import type { CModel, CNode, CTrace } from '../engine/constellation'

type Icon = unknown

const CORE_POS = { x: 460, y: 300 }
// Hit-area sizes mirror the canvas geometry exactly.
const HEX_SIZES = {
  core: { w: 76, h: 66 },
  branch: { w: 64, h: 56 },
  item: { w: 52, h: 45 },
}
const BRANCH_ICONS: Record<string, Icon> = { cloud: Cloud, ai: Brain, systems: Workflow, languages: Code }
const ITEM_ICONS: Record<string, Icon> = {
  AWS: CloudCog,
  'Huawei Cloud': Cloudy,
  Docker: Container,
  Terraform: Layers,
  'GitHub Actions': GitBranch,
  Redis: Zap,
  PostgreSQL: Database,
  TensorFlow: Network,
  PyTorch: Flame,
  SageMaker: Cpu,
  RAG: BookOpen,
  'Computer Vision': Eye,
  Supabase: Server,
  Microservices: Boxes,
  'REST APIs': Globe,
  'Escrow Lifecycles': RefreshCcw,
  'Event-Driven Flows': Activity,
  Caching: HardDrive,
  'Container Orchestration': Ship,
  TypeScript: FileCode,
  Python: Terminal,
  Go: Gauge,
  'C#': Hash,
}
// Hand-spaced so nothing collides. Order matches each branch's items array.
const LAYOUT: Record<string, { branch: { x: number; y: number }; items: { x: number; y: number }[] }> = {
  cloud: {
    branch: { x: 700, y: 150 },
    items: [
      { x: 610, y: 90 }, { x: 700, y: 70 }, { x: 790, y: 90 },
      { x: 580, y: 170 }, { x: 820, y: 170 }, { x: 640, y: 230 }, { x: 760, y: 230 },
    ],
  },
  ai: {
    branch: { x: 220, y: 150 },
    items: [
      { x: 130, y: 90 }, { x: 220, y: 70 }, { x: 310, y: 90 },
      { x: 150, y: 230 }, { x: 290, y: 230 }, { x: 220, y: 245 },
    ],
  },
  systems: {
    branch: { x: 700, y: 450 },
    items: [
      { x: 610, y: 390 }, { x: 700, y: 370 }, { x: 790, y: 390 },
      { x: 610, y: 510 }, { x: 700, y: 530 }, { x: 790, y: 510 },
    ],
  },
  languages: {
    branch: { x: 220, y: 450 },
    items: [
      { x: 140, y: 400 }, { x: 300, y: 400 }, { x: 140, y: 510 }, { x: 300, y: 510 },
    ],
  },
}

function el(html: string): HTMLElement {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild as HTMLElement
}

function chips(items: string[]): string {
  return `<ul class="chips">${items.map((c) => `<li>${c}</li>`).join('')}</ul>`
}

function renderProfile(): HTMLElement {
  const doc = el(`
    <div class="doc">
      <figure class="portrait-frame rise">
        <img class="portrait-photo" src="/profile.jpg" alt="Portrait of James Gabriel Elijah Ty" width="1222" height="1214" loading="lazy">
        <canvas class="portrait-fx" role="img" aria-label="Amber portrait of James Gabriel Elijah Ty" hidden></canvas>
      </figure>
      <p class="rise">${profile.about[0]}</p>
      <p class="rise">${profile.about[1]}</p>
      <dl class="facts rise">
        <div><dt>SCHOOL</dt><dd>${profile.school} — ${profile.degree}, expected ${profile.expected}</dd></div>
        <div><dt>BASE</dt><dd>${profile.location}</dd></div>
        <div><dt>EXCHANGE</dt><dd>UTokyo Virtual Exchange, CALL Apr to Jul 2026: evaluated NounTown and proposed a GenAI and VR language-learning framework.</dd></div>
      </dl>
    </div>`)
  const canvas = doc.querySelector<HTMLCanvasElement>('.portrait-fx')
  const photo = doc.querySelector<HTMLImageElement>('.portrait-photo')
  if (canvas && photo) fxStop = startPortrait(canvas, photo, '/profile.jpg')
  return doc
}

function renderSystems(): HTMLElement {
  const wrap = el('<div class="doc"></div>')
  systems.forEach((s, i) => {
    wrap.appendChild(
      el(`
      <article class="system rise">
        <p class="system-kicker">SYSTEM 0${i + 1}</p>
        <h3>${s.name}</h3>
        <p class="system-tag">${s.tagline}</p>
        ${chips(s.tech)}
        <ul class="bullets">${s.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        <p class="award">▲ ${s.award}</p>
      </article>`),
    )
  })
  return wrap
}

let activeBranch = 'cloud'
// Route-scoped effect handles (skills stardust). Stopped on every route change.
let fxStop: () => void = () => undefined

function renderSkills(): HTMLElement {
  const wrap = el('<div class="doc skills"></div>')
  const map = el('<div class="star-map rise" role="group" aria-label="Skill constellation"></div>')
  const field = el('<div class="star-field"></div>')
  const dust = el('<canvas class="star-dust" aria-hidden="true"></canvas>') as HTMLCanvasElement
  field.appendChild(dust)
  const chart = el('<canvas class="star-const" aria-hidden="true"></canvas>') as HTMLCanvasElement
  field.appendChild(chart)
  const stops: (() => void)[] = [startStardust(dust)]
  const hover: { branch: string | null } = { branch: null }
  const cnodes: CNode[] = []
  const ctraces: CTrace[] = []
  // Model space is 920x600; DOM nodes ride as percentages so the layout
  // stretches across any viewport while the canvas maps the same space.
  const px = (x: number): string => `${((x / 920) * 100).toFixed(2)}%`
  const py = (y: number): string => `${((y / 600) * 100).toFixed(2)}%`
  const select = (id: string): void => {
    activeBranch = id
    blip(600, 50)
    field.setAttribute('data-active', id)
    const detail = wrap.querySelector('.skill-detail')
    if (detail) detail.replaceWith(buildDetail())
    wrap.querySelectorAll('.star-node').forEach((n) => {
      const btn = n.querySelector('.hex[data-branch]') as HTMLElement | null
      const on = !!btn && btn.dataset.branch === activeBranch
      btn?.classList.toggle('is-active', on)
      btn?.setAttribute('aria-pressed', on ? 'true' : 'false')
      n.classList.toggle('is-lit', on)
    })
  }
  const wire = (btn: HTMLButtonElement | null, id: string): void => {
    btn?.addEventListener('click', () => select(id))
    btn?.addEventListener('mouseenter', () => {
      hover.branch = id
    })
    btn?.addEventListener('mouseleave', () => {
      if (hover.branch === id) hover.branch = null
    })
    btn?.addEventListener('focus', () => {
      hover.branch = id
    })
    btn?.addEventListener('blur', () => {
      if (hover.branch === id) hover.branch = null
    })
  }
  branches.forEach((b) => {
    const lay = LAYOUT[b.id]
    if (!lay) return
    ctraces.push({ x1: CORE_POS.x, y1: CORE_POS.y, x2: lay.branch.x, y2: lay.branch.y, major: true })
    cnodes.push({
      branch: b.id, kind: 'core', x: CORE_POS.x, y: CORE_POS.y,
      w: HEX_SIZES.core.w, h: HEX_SIZES.core.h, art: { text: 'JTY' },
    })
    const lit = b.id === activeBranch ? ' is-lit' : ''
    const on = b.id === activeBranch
    const node = el(
      `<div class="star-node${lit}" style="left:${px(lay.branch.x)};top:${py(lay.branch.y)}"><button type="button" data-branch="${b.id}" class="hex branch" aria-pressed="${on ? 'true' : 'false'}" aria-label="${b.label} branch"></button><span class="hex-label" aria-hidden="true">${b.label}</span></div>`,
    )
    wire(node.querySelector('button'), b.id)
    cnodes.push({
      branch: b.id, kind: 'branch', x: lay.branch.x, y: lay.branch.y,
      w: HEX_SIZES.branch.w, h: HEX_SIZES.branch.h, art: { icon: BRANCH_ICONS[b.id] ?? Code },
    })
    field.appendChild(node)
    b.items.forEach((name, i) => {
      const p = lay.items[i] ?? lay.branch
      ctraces.push({ x1: lay.branch.x, y1: lay.branch.y, x2: p.x, y2: p.y, major: false })
      cnodes.push({
        branch: b.id, kind: 'item', x: p.x, y: p.y,
        w: HEX_SIZES.item.w, h: HEX_SIZES.item.h, art: { icon: ITEM_ICONS[name] ?? Code },
      })
      const item = el(
        `<div class="star-node${lit}" style="left:${px(p.x)};top:${py(p.y)}"><button type="button" data-branch="${b.id}" class="hex item" aria-pressed="${on ? 'true' : 'false'}" aria-label="${name}, ${b.label}"></button><span class="hex-label item-label" aria-hidden="true">${name}</span></div>`,
      )
      wire(item.querySelector('button'), b.id)
      field.appendChild(item)
    })
  })
  // One core node only: drop the duplicates pushed per branch.
  let coreKept = false
  const model: CModel = {
    nodes: cnodes.filter((n) => {
      if (n.kind !== 'core') return true
      if (coreKept) return false
      coreKept = true
      return true
    }),
    traces: ctraces,
    isActive: (branch: string) => branch === activeBranch,
    hover,
  }
  stops.push(startConstellation(chart, model))
  fxStop = () => stops.forEach((s) => s())
  map.appendChild(field)
  // D-pad: arrows jump focus to the nearest node in that direction.
  map.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    if (!target?.classList.contains('hex')) return
    const dirs: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    const dir = dirs[e.key]
    if (!dir) return
    e.preventDefault()
    const btns = [...map.querySelectorAll<HTMLButtonElement>('.hex')]
    const r0 = target.getBoundingClientRect()
    const x0 = r0.left + r0.width / 2
    const y0 = r0.top + r0.height / 2
    let best: HTMLButtonElement | null = null
    let bestScore = Infinity
    for (const b of btns) {
      if (b === target) continue
      const r = b.getBoundingClientRect()
      const dx = r.left + r.width / 2 - x0
      const dy = r.top + r.height / 2 - y0
      const along = dx * dir[0] + dy * dir[1]
      if (along <= 4) continue
      const lateral = Math.abs(dx * dir[1] - dy * dir[0])
      const score = along + lateral * 2.5
      if (score < bestScore) {
        bestScore = score
        best = b
      }
    }
    best?.focus()
  })
  field.setAttribute('data-active', activeBranch)
  const totalNodes = branches.reduce((n, b) => n + b.items.length, 0)
  map.appendChild(
    el(`<p class="map-hint" aria-hidden="true">${totalNodes} NODES · ${branches.length} BRANCHES — SELECT A NODE</p>`),
  )
  wrap.append(map, buildDetail())
  return wrap
}

function buildDetail(): HTMLElement {
  const b = branches.find((x) => x.id === activeBranch) ?? branches[0]
  return el(`
    <div class="skill-detail rise">
      <h3>${b.label}</h3>
      ${chips(b.items)}
      <p>${b.proof}</p>
    </div>`)
}

function renderExperience(): HTMLElement {
  const wrap = el('<ol class="timeline"></ol>')
  timeline.forEach((t) => {
    wrap.appendChild(
      el(`
      <li class="stop rise">
        <p class="stop-period">${t.period}</p>
        <h3>${t.role} <span class="stop-org">— ${t.org}</span></h3>
        <ul class="bullets">${t.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
      </li>`),
    )
  })
  return el('<div class="doc"></div>').appendChild(wrap).parentElement as HTMLElement
}

type Tier = 'gold' | 'silver' | 'bronze'

function tierOf(result: string): Tier {
  const r = result.toUpperCase()
  if (r.includes('CHAMPION') || r.includes('PROJECT OF THE YEAR') || r.includes('1ST')) return 'gold'
  if (r.includes('RUNNER UP')) return 'silver'
  return 'bronze'
}

const TIER_MEDAL: Record<Tier, string> = { gold: '◆', silver: '▲', bronze: '●' }

function renderRecognition(): HTMLElement {
  const wrap = el('<div class="doc"></div>')
  wrap.appendChild(el(`<h3 class="sub rise">Awards</h3>`))
  const filters = el('<div class="filter-row rise" role="group" aria-label="Filter awards"></div>')
  const list = el('<ul class="trophies"></ul>')
  const items: HTMLElement[] = awards.map((a) => {
    const tier = tierOf(a.result)
    return el(`<li class="trophy tier-${tier} rise" data-tier="${tier}"><span class="trophy-medal" aria-hidden="true">${TIER_MEDAL[tier]}</span><span class="trophy-main"><span class="award-name">${a.name}</span>${a.project ? `<span class="award-proj">${a.project}</span>` : ''}</span><span class="award-result">${TIER_MEDAL[tier]} ${a.result}</span></li>`)
  })
  items.forEach((li) => list.appendChild(li))
  const defs: [string, string][] = [['all', 'ALL'], ['gold', 'TOP HONORS'], ['silver', 'RUNNERS-UP'], ['bronze', 'MENTIONS']]
  defs.forEach(([key, label]) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `filter-btn${key === 'all' ? ' is-active' : ''}`
    b.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false')
    b.textContent = label
    b.addEventListener('click', () => {
      blip(600, 50)
      filters.querySelectorAll('.filter-btn').forEach((o) => {
        const on = o === b
        o.classList.toggle('is-active', on)
        o.setAttribute('aria-pressed', on ? 'true' : 'false')
      })
      items.forEach((li) => {
        li.hidden = key !== 'all' && li.dataset.tier !== key
      })
    })
    filters.appendChild(b)
  })
  wrap.append(filters, list)
  wrap.appendChild(el(`<h3 class="sub rise">Certifications</h3>`))
  const kase = el('<div class="case rise"></div>')
  const lid = el(`<button class="case-lid" type="button" aria-expanded="false"><span class="case-title">BADGE CASE</span><span class="case-count">${certifications.length} CREDENTIALS</span><span class="case-state">OPEN ▸</span></button>`) as HTMLButtonElement
  const body = el('<div class="case-body"></div>')
  body.setAttribute('hidden', '')
  const clip = el('<div class="case-clip"></div>')
  clip.appendChild(
    el(`<ul class="badges">${certifications.map((c, i) => `<li><span class="badge-disc" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="badge-name">${c}</span></li>`).join('')}</ul>`),
  )
  body.appendChild(clip)
  kase.append(lid, body)
  wrap.appendChild(kase)
  const state = lid.querySelector('.case-state')
  lid.addEventListener('click', () => {
    const willOpen = !body.classList.contains('open')
    blip(willOpen ? 520 : 440, 50)
    lid.setAttribute('aria-expanded', String(willOpen))
    if (state) state.textContent = willOpen ? 'CLOSE ▾' : 'OPEN ▸'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (willOpen) {
      body.removeAttribute('hidden')
      requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('open')))
    } else {
      body.classList.remove('open')
      if (reduced) body.setAttribute('hidden', '')
      else {
        window.setTimeout(() => {
          if (!body.classList.contains('open')) body.setAttribute('hidden', '')
        }, 320)
      }
    }
  })
  return wrap
}

function renderContact(): HTMLElement {
  return el(`
    <div class="doc">
      <p class="rise">Open to internships for Summer 2026 to 2027, collaborations, and community work.</p>
      <ul class="contact-list">
        <li class="rise"><a href="mailto:${profile.email}">EMAIL — ${profile.email}</a></li>
        <li class="rise"><a href="${profile.github}" target="_blank" rel="noopener noreferrer">GITHUB — github.com/JP-TY</a></li>
        <li class="rise"><a href="${profile.linkedin}" target="_blank" rel="noopener noreferrer">LINKEDIN — James Gabriel Elijah Ty</a></li>
      </ul>
    </div>`)
}

export function renderBody(route: RouteId): HTMLElement {
  fxStop()
  fxStop = () => undefined
  switch (route) {
    case 'systems':
      return renderSystems()
    case 'skills':
      return renderSkills()
    case 'experience':
      return renderExperience()
    case 'recognition':
      return renderRecognition()
    case 'contact':
      return renderContact()
    case 'profile':
    default:
      return renderProfile()
  }
}
