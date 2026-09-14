import {
  awards,
  awardPhotos,
  branches,
  certifications,
  certBadges,
  profile,
  projects,
  timeline,
} from '../data/content'
import type { RouteId } from '../engine/router'
import { blip } from '../engine/audio'
import { startStardust } from '../engine/stardust'
import {
  Activity,
  Award,
  BookOpen,
  Boxes,
  Brain,
  Cloud,
  Code,
  Crown,
  Flag,
  Gem,
  Globe,
  HardDrive,
  Hash,
  Medal,
  RefreshCcw,
  Shield,
  Ship,
  Star,
  Trophy,
  Workflow,
} from 'lucide'
import { startConstellation, iconSVG } from '../engine/constellation'
import { siGithub, siGmail } from 'simple-icons'
import sagemakerURL from '../assets/Amazon-Web-Service-Sagemaker--Streamline-Ultimate.png'
import {
  siDocker,
  siGithubactions,
  siGo,
  siHuawei,
  siOpencv,
  siPostgresql,
  siPython,
  siPytorch,
  siRedis,
  siSupabase,
  siTensorflow,
  siTerraform,
  siTypescript,
} from 'simple-icons'
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

/** AWS never shipped a public mark in the icon set, so the wordmark +
 *  smile is redrawn here, same silhouette as the console badge. */
const awsMark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="12.6" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="8" fill="#fff">aws</text><path d="M5.5 15.2 Q12 19.6 18.5 14.4" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M16.2 13.1 L18.9 14.2 L17.1 16.6 Z" fill="#fff"/></svg>`

/** Item art, with size overrides where a mark needs room to read —
 *  AWS renders bigger than the standard 24px box, SageMaker uses the
 *  uploaded PNG rasterized like the portrait medallion. */
const nodeArt = (name: string): CNode['art'] =>
  name === 'AWS'
    ? { icon: ITEM_ICONS[name] ?? Code, box: 40 }
    : name === 'SageMaker'
      ? { img: sagemakerURL, box: 28, ink: true }
      : { icon: ITEM_ICONS[name] ?? Code }

const ITEM_ICONS: Record<string, Icon> = {
  AWS: awsMark,
  'Huawei Cloud': siHuawei.path,
  Docker: siDocker.path,
  Terraform: siTerraform.path,
  'GitHub Actions': siGithubactions.path,
  Redis: siRedis.path,
  PostgreSQL: siPostgresql.path,
  TensorFlow: siTensorflow.path,
  PyTorch: siPytorch.path,
  RAG: BookOpen,
  'Computer Vision': siOpencv.path,
  Supabase: siSupabase.path,
  Microservices: Boxes,
  'REST APIs': Globe,
  'Escrow Lifecycles': RefreshCcw,
  'Event-Driven Flows': Activity,
  Caching: HardDrive,
  'Container Orchestration': Ship,
  TypeScript: siTypescript.path,
  Python: siPython.path,
  Go: siGo.path,
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

/** D-pad for tile clusters: arrows jump focus to the nearest tile in
 *  that direction, measured from live rects so grids and rails both work.
 *  Hidden tiles (closed case, filtered rows) never catch focus. When
 *  nothing lies that way the event is left alone, so paging and
 *  scrolling keep working at the edges. */
function wireArrowNav(root: HTMLElement, selector: string): void {
  const dirs: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  }
  root.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null
    if (!target?.matches(selector)) return
    const dir = dirs[e.key]
    if (!dir) return
    const tiles = [...root.querySelectorAll<HTMLElement>(selector)].filter(
      (t) => t === target || t.offsetParent !== null,
    )
    const r0 = target.getBoundingClientRect()
    const x0 = r0.left + r0.width / 2
    const y0 = r0.top + r0.height / 2
    let best: HTMLElement | null = null
    let bestScore = Infinity
    for (const b of tiles) {
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
    if (!best) return
    e.preventDefault()
    best.focus()
    best.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}

function chips(items: string[]): string {
  return `<ul class="chips">${items.map((c) => `<li>${c}</li>`).join('')}</ul>`
}

function renderProfile(): HTMLElement {
  const doc = el(`
    <div class="doc profile-doc">
      <div class="id-hero rise">
        <figure class="portrait-frame">
          <img class="portrait-photo" src="/profile.webp" alt="Portrait of James Gabriel Elijah Ty" width="700" height="695" loading="lazy" decoding="async">
        </figure>
        <div class="id-card">
          <p class="id-kicker">IDENTITY.SYS — ONLINE</p>
          <h3 class="id-name">${profile.name}</h3>
          <p class="id-role">${profile.role}</p>
          <dl class="mini-facts">
            <div><dt>LOCATION</dt><dd>${profile.location}</dd></div>
            <div><dt>EXPECTED GRADUATION</dt><dd>${profile.expected}</dd></div>
          </dl>
          <div class="id-social">
            <a class="soc" href="mailto:${profile.email}" aria-label="Email James Ty" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${siGmail.path}"/></svg></a>
            <a class="soc" href="${profile.github}" target="_blank" rel="noopener noreferrer" aria-label="James Ty on GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${siGithub.path}"/></svg></a>
            <a class="soc" href="${profile.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="James Ty on LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect class="in-tile" x="3" y="3" width="18" height="18" rx="3.5"/><text class="in-text" x="12" y="16.6" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="12.5">in</text></svg></a>
          </div>
          <div class="id-actions">
            <a class="resume-btn" href="/resume.pdf" download="James-Ty-Resume.pdf">DOWNLOAD RESUME ↓</a>
          </div>
        </div>
      </div>
      <div class="profile-grid">
        <div class="rise">
          <p>${profile.about[0]}</p>
          <p>${profile.about[1]}</p>
        </div>
        <aside class="ex-card rise">
          <p class="ex-kicker">HIGHLIGHTS</p>
          <ol class="ex-list">
            ${timeline
              .slice(0, 3)
              .map(
                (t) => `<li><div><p class="ex-role">${t.role}</p><p class="ex-org">${t.org} · ${t.period}</p></div></li>`,
              )
              .join('')}
          </ol>
          <a class="ex-more" href="#/experience">FULL RECORD →</a>
        </aside>
      </div>
      <dl class="facts rise">
        <div><dt>SCHOOL</dt><dd>${profile.school} — ${profile.degree}, expected ${profile.expected}</dd></div>
        <div><dt>EXCHANGE</dt><dd><span class="xchg-top"><span>UTokyo Virtual Exchange</span><span>Apr – Jul 2026</span></span><span class="xchg-sub">Computer Assisted Language Learning</span></dd></div>
      </dl>
    </div>`)
  return doc
}

function renderProjects(): HTMLElement {
  const wrap = el('<div class="doc"></div>')
  projects.forEach((s, i) => {
    wrap.appendChild(
      el(`
      <article class="project rise">
        <p class="project-kicker">PROJECT 0${i + 1}</p>
        <h3>${s.name}</h3>
        <p class="project-tag">${s.tagline}</p>
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
    btn?.addEventListener('click', () => {
      select(id)
    })
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
      w: HEX_SIZES.core.w, h: HEX_SIZES.core.h,
      art: { img: '/Ty2x2.webp', color: true },
      caption: 'JAMES TY',
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
        w: HEX_SIZES.item.w, h: HEX_SIZES.item.h, art: nodeArt(name),
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
  wireArrowNav(map, '.hex')
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

function renderRecognition(): HTMLElement {
  const wrap = el('<div class="doc"></div>')
  const h3Awards = el(`<h3 class="sub rise">Awards</h3>`)
  const GEM_ICONS = [Trophy, Medal, Crown, Shield, Star, Gem, Award, Flag]
  const list = el('<ul class="trophies"></ul>')
  const closePopup = (): void => {
    wrap.querySelector('.honor-pop-backdrop')?.remove()
    wrap.querySelector('.honor-pop')?.remove()
  }
  const openPopup = (kicker: string, title: string, meta: string, photos: string[], invoker: HTMLButtonElement | null): void => {
    closePopup()
    const back = el('<div class="honor-pop-backdrop"></div>')
    const pop = el(
      `<div class="honor-pop" role="dialog" aria-modal="true" aria-label="${title}"><p class="node-pop-kicker">${kicker}</p><h3 class="node-pop-title">${title}</h3><p class="honor-pop-meta">${meta}</p><div class="honor-pop-photos">${photos.map((src) => `<img src="${src}" alt="" loading="lazy" decoding="async">`).join('')}</div><button type="button" class="node-pop-close">CLOSE ✕</button></div>`,
    )
    const closeBtn = pop.querySelector<HTMLButtonElement>('.node-pop-close')
    const close = (): void => {
      document.removeEventListener('keydown', onKey, true)
      back.remove()
      pop.remove()
      invoker?.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      } else if (e.key === 'Tab') {
        // The dialog owns focus while open; nothing behind it is reachable.
        e.preventDefault()
        closeBtn?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey, true)
    back.addEventListener('click', close)
    closeBtn?.addEventListener('click', close)
    wrap.append(back, pop)
    closeBtn?.focus({ preventScroll: true })
  }
  const markAward = (btn: HTMLButtonElement | null): (typeof awards)[number] | undefined => {
    if (!btn) return undefined
    list.querySelectorAll('.gem').forEach((o) => {
      const on = o === btn
      o.classList.toggle('is-active', on)
      o.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
    // One current tile across the whole tray: moving here clears credentials.
    wrap.querySelectorAll('.badges .gem').forEach((o) => {
      o.classList.remove('is-active')
      o.setAttribute('aria-pressed', 'false')
    })
    return awards[Number(btn.dataset.index)]
  }
  const selectAward = (btn: HTMLButtonElement | null): void => {
    if (!btn) return
    blip(660, 50)
    const a = markAward(btn)
    if (a) {
      openPopup('SELECTED HONOR', a.name, `${a.level.toUpperCase()} · ${a.project ? `${a.project} · ` : ''}${a.result}`, awardPhotos[a.name] ?? [], btn)
    }
  }
  const items: HTMLElement[] = awards.map((a, i) => {
    const tier = tierOf(a.result)
    const photos = awardPhotos[a.name] ?? []
    const title = (a.project ?? a.name).toUpperCase()
    const li = el(`<li class="trophy tier-${tier} rise${photos.length ? ' photo' : ''}" data-tier="${tier}"></li>`)
    const btn = photos.length
      ? el(
        `<button type="button" class="gem gem-win" aria-pressed="false" aria-label="${a.name}, ${a.level}, ${a.result}"><span class="win-chrome" aria-hidden="true"><i></i><i></i><i></i><b>A-${String(i + 1).padStart(2, '0')}</b><em>${title}</em></span>${photos.length > 1
          ? `<span class="win-trio" aria-hidden="true">${photos.map((src) => `<img class="award-img" src="${src}" alt="" loading="lazy" decoding="async">`).join('')}</span>`
          : `<img class="award-img" src="${photos[0]}" alt="" loading="lazy" decoding="async">`}</button>`,
      ) as HTMLButtonElement
      : el(
        `<button type="button" class="gem" aria-pressed="false" aria-label="${a.name}, ${a.level}, ${a.result}"><span class="gem-face">${iconSVG(GEM_ICONS[i % GEM_ICONS.length], 34, 'currentColor')}</span></button>`,
      ) as HTMLButtonElement
    btn.dataset.index = String(i)
    btn.addEventListener('click', () => selectAward(btn))
    // Keyboard arrival moves the current-tile marker too, so the highlight
    // always sits on the most recent tile — never stranded on the old one.
    btn.addEventListener('focus', () => {
      markAward(btn)
    })
    li.appendChild(btn)
    return li
  })
  items.forEach((li) => list.appendChild(li))
  markAward(list.querySelector('.gem') as HTMLButtonElement | null)
  const h3Certs = el(`<h3 class="sub rise">Certifications</h3>`)
  const kase = el('<div class="case rise"></div>')
  const lid = el(`<button class="case-lid" type="button" aria-expanded="true"><span class="case-title">BADGE CASE</span><span class="case-count">${String(awards.length).padStart(2, '0')} HONORS · ${String(certifications.length).padStart(2, '0')} CREDENTIALS</span><span class="case-state">CLOSE ▾</span></button>`) as HTMLButtonElement
  const body = el('<div class="case-body open"></div>')
  const clip = el('<div class="case-clip"></div>')
  const markCert = (btn: HTMLButtonElement | null): void => {
    if (!btn) return
    clip.querySelectorAll('.gem').forEach((o) => {
      const on = o === btn
      o.classList.toggle('is-active', on)
      o.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }
  const selectCert = (btn: HTMLButtonElement | null): void => {
    if (!btn) return
    blip(660, 50)
    markCert(btn)
    const name = btn.dataset.name ?? ''
    const num = btn.dataset.num ?? '01'
    const src = certBadges[name]
    openPopup('SELECTED CREDENTIAL', name, `CREDENTIAL ${num} OF ${String(certifications.length).padStart(2, '0')}`, src ? [src] : [], btn)
  }
  const rail = el(
    `<ul class="badges">${certifications
      .map((c, i) => {
        const num = String(i + 1).padStart(2, '0')
        const photo = certBadges[c]
        const inner = photo
          ? `<span class="win-chrome" aria-hidden="true"><i></i><i></i><i></i><em>CRED ${num}</em></span><img class="badge-img" src="${photo}" alt="" loading="lazy" decoding="async">`
          : `<span class="gem-face"><span class="badge-disc" aria-hidden="true">${num}</span></span>`
        return `<li class="${photo ? 'has-img' : ''}"><button type="button" class="gem${photo ? ' gem-cwin' : ' gem-cert'}" aria-pressed="false" aria-label="${c}" data-num="${num}" data-name="${c}">${inner}</button></li>`
      })
      .join('')}</ul>`,
  )
  clip.appendChild(rail)
  clip.querySelectorAll<HTMLButtonElement>('.badges .gem').forEach((btn) => {
    btn.addEventListener('click', () => selectCert(btn))
    btn.addEventListener('focus', () => {
      markCert(btn)
    })
  })
  markCert(clip.querySelector('.badges .gem'))
  clip.prepend(h3Awards, list, h3Certs)
  // One pool for the whole tray: arrows flow from the awards grid down
  // into the credential rail and back up, like one continuous shelf.
  wireArrowNav(clip, '.trophies .gem, .badges .gem')
  body.appendChild(clip)
  kase.append(lid, body)
  kase.appendChild(el('<div class="case-latch" aria-hidden="true"></div>'))
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
    case 'projects':
      return renderProjects()
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
