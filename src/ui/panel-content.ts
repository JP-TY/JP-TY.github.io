/**
 * Panel content builders — real semantic DOM from content.ts.
 * The canvas is the map; these panels are the territory.
 */
import {
  achievements,
  certifications,
  missions,
  profile,
  projects,
  sections,
  skills,
  type SectionContent,
} from '../data/content'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function tags(list: string[]): HTMLElement {
  const row = el('p', 'tech-row')
  for (const t of list) row.appendChild(el('span', 'tag', t))
  return row
}

function projectCard(p: (typeof projects)[number]): HTMLElement {
  const card = el('article', 'project-card')
  card.id = `project-${p.id}`
  card.appendChild(el('p', 'kicker', 'PROJECT DOSSIER'))
  card.appendChild(el('h3', undefined, p.name))
  card.appendChild(el('p', undefined, p.tagline))
  const ul = el('ul')
  for (const b of p.bullets) ul.appendChild(el('li', undefined, b))
  card.appendChild(ul)
  card.appendChild(tags(p.tech))
  if (p.award) card.appendChild(el('p', 'award', `★ ${p.award}`))
  return card
}

function buildAbout(body: HTMLElement): void {
  for (const para of profile.about) body.appendChild(el('p', undefined, para))
  body.appendChild(el('h3', undefined, 'Flight School'))
  body.appendChild(el('p', undefined, `${profile.education.school} — ${profile.education.degree} (${profile.education.expected})`))
  body.appendChild(el('p', undefined, profile.education.extra))
}

function buildProjects(body: HTMLElement): void {
  for (const p of projects) body.appendChild(projectCard(p))
}

function buildExperience(body: HTMLElement): void {
  for (const m of missions) {
    const mission = el('article', 'mission')
    mission.appendChild(el('p', 'kicker', m.period))
    mission.appendChild(el('h3', undefined, `${m.role} — ${m.org}`))
    const ul = el('ul')
    for (const b of m.bullets) ul.appendChild(el('li', undefined, b))
    mission.appendChild(ul)
    mission.appendChild(tags(m.tags))
    body.appendChild(mission)
  }
}

function buildAchievements(body: HTMLElement): void {
  const table = el('table', 'scores')
  table.setAttribute('aria-label', 'Competition results')
  const thead = el('thead')
  const hr = el('tr')
  for (const h of ['EVENT', 'RESULT', 'CRAFT']) {
    const th = el('th', undefined, h)
    th.scope = 'col'
    hr.appendChild(th)
  }
  thead.appendChild(hr)
  table.appendChild(thead)
  const tbody = el('tbody')
  for (const a of achievements) {
    const tr = el('tr')
    const tdName = el('td', undefined, a.name)
    const tdResult = el('td', 'result', a.result)
    const tdCraft = el('td', undefined, a.project ?? '—')
    tr.append(tdName, tdResult, tdCraft)
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  body.appendChild(table)
  body.appendChild(el('h3', undefined, 'Certifications'))
  const ul = el('ul')
  for (const c of certifications) ul.appendChild(el('li', undefined, c))
  body.appendChild(ul)
}

function buildSkills(body: HTMLElement): void {
  for (const group of skills) {
    body.appendChild(el('h3', undefined, group.label))
    body.appendChild(tags(group.items))
  }
}

function buildContact(body: HTMLElement): void {
  const list = el('ul')
  const rows: [string, string, string][] = [
    ['EMAIL', profile.email, `mailto:${profile.email}`],
    ['PHONE', profile.phone, `tel:${profile.phone.replace(/[^+\d]/g, '')}`],
    ['GITHUB', 'github.com/JP-TY', profile.github],
    ['LINKEDIN', 'linkedin.com/in/james-gabriel-elijah-ty', profile.linkedin],
  ]
  for (const [label, text, href] of rows) {
    const li = el('li')
    li.appendChild(el('span', 'kicker', `${label} `))
    const a = el('a', undefined, text)
    a.href = href
    if (href.startsWith('http')) {
      a.rel = 'noopener'
      a.target = '_blank'
    }
    li.appendChild(a)
    list.appendChild(li)
  }
  body.appendChild(list)
  body.appendChild(
    el('p', undefined, 'Recruiters: yes, the rocket is the point — but so is the shipping record above. Open a channel anytime.')
  )
}

const BUILDERS: Record<string, (body: HTMLElement) => void> = {
  about: buildAbout,
  projects: buildProjects,
  experience: buildExperience,
  achievements: buildAchievements,
  skills: buildSkills,
  contact: buildContact,
}

/** Build one <article class="panel"> per section, appended to #panels. */
export function buildPanels(root: HTMLElement): Map<string, HTMLElement> {
  const panels = new Map<string, HTMLElement>()

  const srH1 = el('h1', 'sr-only', `${profile.name} — ${profile.heroLine}`)
  root.appendChild(srH1)

  for (const section of sections) {
    const panel = el('article', 'panel')
    panel.id = `panel-${section.id}`
    panel.hidden = true
    panel.tabIndex = -1
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-labelledby', `panel-${section.id}-title`)
    panel.style.setProperty('--accent', `var(${section.accentVar})`)

    const titlebar = el('header', 'panel-titlebar')
    const title = el('span', undefined, `╔═ ${section.title}`)
    title.id = `panel-${section.id}-title`
    const undock = el('button', 'panel-undock', '[ UNDOCK: ESC ]')
    undock.type = 'button'
    undock.dataset.undock = section.id
    titlebar.append(title, undock)

    const body = el('div', 'panel-body')
    body.appendChild(el('h2', undefined, section.heading))
    body.appendChild(el('p', 'panel-intro', section.intro))
    BUILDERS[section.id]?.(body)

    panel.append(titlebar, body)
    root.appendChild(panel)
    panels.set(section.id, panel)
  }
  return panels
}

export const sectionById = (id: string): SectionContent | undefined =>
  sections.find((s) => s.id === id)
