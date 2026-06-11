/**
 * James Ty Portfolio — section document renderers. Real DOM, semantic markup.
 * The theme lives in the layout and motion; the copy stays professional.
 */

import {
  profile,
  projects,
  missions,
  achievements,
  certifications,
  skills,
  type ProjectContent,
} from '../data/content'

type El = HTMLElement

function el(tag: string, cls: string, text?: string): El {
  const e = document.createElement(tag)
  e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function renderAbout(body: El) {
  const gra = el('div', 'about-grid reveal')
  const colL = el('div', 'about-col')
  profile.about.forEach((p) => colL.appendChild(el('p', 'prose', p)))
  gra.appendChild(colL)

  const edu = el('div', 'edu-card')
  edu.appendChild(el('p', 'edu-kicker', 'EDUCATION'))
  edu.appendChild(el('h3', 'edu-school', profile.education.school))
  edu.appendChild(el('p', 'edu-degree', profile.education.degree))
  edu.appendChild(el('p', 'edu-period', profile.education.expected))
  edu.appendChild(el('p', 'edu-extra', profile.education.extra))
  gra.appendChild(edu)
  body.appendChild(gra)

  const links = el('p', 'about-links reveal')
  const mk = (href: string, label: string) => {
    const a = document.createElement('a')
    a.href = href
    a.textContent = label
    if (href.startsWith('http')) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    }
    return a
  }
  links.append(
    'Contact: ',
    mk(`mailto:${profile.email}`, profile.email),
    ' · ',
    mk(profile.github, 'GitHub'),
    ' · ',
    mk(profile.linkedin, 'LinkedIn'),
  )
  body.appendChild(links)
}

function projectCard(p: ProjectContent): El {
  const card = el('article', 'project-card reveal')
  const head = el('div', 'project-head')
  const titleWrap = el('div', 'project-titlewrap')
  titleWrap.appendChild(el('h3', 'project-name', p.name))
  titleWrap.appendChild(el('p', 'project-tagline', p.tagline))
  head.appendChild(titleWrap)
  card.appendChild(head)

  const ul = el('ul', 'card-bullets')
  p.bullets.forEach((b) => ul.appendChild(el('li', 'card-bullet', b)))
  card.appendChild(ul)

  const tech = el('p', 'project-stack')
  tech.appendChild(el('span', 'stack-label', 'STACK — '))
  p.tech.forEach((t) => tech.appendChild(el('span', 'stack-chip', t)))
  card.appendChild(tech)

  if (p.award) card.appendChild(el('p', 'project-award', p.award))
  return card
}


function renderProjects(body: El) {
  projects.forEach((p) => body.appendChild(projectCard(p)))
}

function renderExperience(body: El) {
  missions.forEach((m) => {
    const card = el('article', 'log-card reveal')
    const head = el('div', 'log-head')
    const wrap = el('div', 'log-titlewrap')
    wrap.appendChild(el('h3', 'log-org', m.org))
    wrap.appendChild(el('p', 'log-role', m.role))
    head.appendChild(wrap)
    head.appendChild(el('p', 'log-period', m.period))
    card.appendChild(head)

    const ul = el('ul', 'card-bullets')
    m.bullets.forEach((b) => ul.appendChild(el('li', 'card-bullet', b)))
    card.appendChild(ul)

    const tags = el('p', 'log-tags')
    m.tags.forEach((t) => tags.appendChild(el('span', 'tag', t)))
    card.appendChild(tags)
    body.appendChild(card)
  })
}

function renderAchievements(body: El) {
  const grid = el('div', 'awards-grid reveal')
  achievements.forEach((a, i) => {
    const row = el('div', 'award-row')
    row.appendChild(el('span', 'award-index', String(i + 1).padStart(2, '0')))
    const mid = el('div', 'award-mid')
    mid.appendChild(el('p', 'award-name', a.name))
    mid.appendChild(el('p', 'award-result', a.result))
    row.appendChild(mid)
    row.appendChild(a.project ? el('span', 'award-project', a.project) : el('span', 'award-spacer'))
    grid.appendChild(row)
  })
  body.appendChild(grid)

  const certs = el('div', 'certs reveal')
  certs.appendChild(el('h3', 'certs-heading', 'CERTIFICATIONS'))
  const ul = el('ul', 'certs-list')
  certifications.forEach((c) => ul.appendChild(el('li', 'cert-item', c)))
  certs.appendChild(ul)
  body.appendChild(certs)
}

function renderSkills(body: El) {
  const grid = el('div', 'skills-grid reveal')
  skills.forEach((g) => {
    const grp = el('div', 'skill-group')
    grp.appendChild(el('h3', 'skill-label', g.label))
    const wrap = el('p', 'skill-items')
    g.items.forEach((item) => wrap.appendChild(el('span', 'chip', item)))
    grp.appendChild(wrap)
    grid.appendChild(grp)
  })
  body.appendChild(grid)
}

function renderContact(body: El) {
  const wrap = el('div', 'contact reveal')

  const grid = el('div', 'contact-grid')
  const mk = (href: string, kicker: string, label: string, note: string) => {
    const a = document.createElement('a')
    a.className = 'contact-card'
    a.href = href
    if (href.startsWith('http')) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    }
    a.innerHTML =
      `<span class="contact-kicker">${kicker}</span>` +
      `<span class="contact-label">${label}</span>` +
      `<span class="contact-note">${note}</span>`
    return a
  }
  grid.appendChild(mk(`mailto:${profile.email}`, 'EMAIL', profile.email, 'Typical response within 24 hours'))
  grid.appendChild(mk(profile.github, 'GITHUB', 'github.com/JP-TY', 'Code and project repositories'))
  grid.appendChild(mk(profile.linkedin, 'LINKEDIN', 'LinkedIn Profile', 'Professional profile'))
  wrap.appendChild(grid)

  body.appendChild(wrap)
}

const RENDERERS: Record<string, (body: El) => void> = {
  about: renderAbout,
  projects: renderProjects,
  experience: renderExperience,
  achievements: renderAchievements,
  skills: renderSkills,
  contact: renderContact,
}

export function renderSection(id: string, body: El) {
  const fn = RENDERERS[id]
  if (fn) fn(body)
}

