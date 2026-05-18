/**
 * Classic mode: a fully accessible scrolling portfolio rendered from
 * the same content.ts. Zero theatrics, 100% fact-complete.
 */
import {
  achievements,
  certifications,
  missions,
  profile,
  projects,
  skills,
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

export function buildClassic(root: HTMLElement, onBack: () => void): void {
  root.textContent = ''

  root.appendChild(el('h1', undefined, profile.name))
  root.appendChild(el('p', 'lede', `${profile.heroLine} ${profile.bootByline}. Based in ${profile.location}.`))

  const about = el('section')
  about.appendChild(el('h2', 'green', 'About'))
  for (const p of profile.about) about.appendChild(el('p', undefined, p))
  about.appendChild(
    el('p', undefined, `${profile.education.school} — ${profile.education.degree} (${profile.education.expected}). ${profile.education.extra}`)
  )
  root.appendChild(about)

  const proj = el('section')
  proj.appendChild(el('h2', 'cyan', 'Projects'))
  for (const p of projects) {
    const card = el('article')
    card.appendChild(el('h3', undefined, p.name))
    card.appendChild(el('p', undefined, p.tagline))
    const ul = el('ul')
    for (const b of p.bullets) ul.appendChild(el('li', undefined, b))
    card.appendChild(ul)
    if (p.award) card.appendChild(el('p', 'award', `★ ${p.award}`))
    const tech = el('p')
    tech.textContent = `Stack: ${p.tech.join(' · ')}`
    card.appendChild(tech)
    proj.appendChild(card)
  }
  root.appendChild(proj)

  const exp = el('section')
  exp.appendChild(el('h2', 'violet', 'Experience'))
  for (const m of missions) {
    const entry = el('article')
    entry.appendChild(el('h3', undefined, `${m.role} — ${m.org}`))
    entry.appendChild(el('p', 'kicker', m.period))
    const ul = el('ul')
    for (const b of m.bullets) ul.appendChild(el('li', undefined, b))
    entry.appendChild(ul)
    exp.appendChild(entry)
  }
  root.appendChild(exp)

  const ach = el('section')
  ach.appendChild(el('h2', 'amber', 'Achievements'))
  const ulA = el('ul')
  for (const a of achievements) {
    ulA.appendChild(el('li', undefined, `${a.name} — ${a.result}${a.project ? ` (${a.project})` : ''}`))
  }
  ach.appendChild(ulA)
  ach.appendChild(el('h3', undefined, 'Certifications'))
  const ulC = el('ul')
  for (const c of certifications) ulC.appendChild(el('li', undefined, c))
  ach.appendChild(ulC)
  root.appendChild(ach)

  const skl = el('section')
  skl.appendChild(el('h2', 'magenta', 'Skills'))
  for (const g of skills) {
    skl.appendChild(el('p', undefined, `${g.label}: ${g.items.join(' · ')}`))
  }
  root.appendChild(skl)

  const contact = el('section')
  contact.appendChild(el('h2', 'orange', 'Contact'))
  const ulE = el('ul')
  const rows: [string, string, string][] = [
    ['Email', profile.email, `mailto:${profile.email}`],
    ['Phone', profile.phone, `tel:${profile.phone.replace(/[^+\d]/g, '')}`],
    ['GitHub', 'github.com/JP-TY', profile.github],
    ['LinkedIn', 'linkedin.com/in/james-gabriel-elijah-ty', profile.linkedin],
  ]
  for (const [label, text, href] of rows) {
    const li = el('li')
    li.appendChild(el('span', 'kicker', `${label}: `))
    const a = el('a', undefined, text)
    a.href = href
    if (href.startsWith('http')) {
      a.rel = 'noopener'
      a.target = '_blank'
    }
    li.appendChild(a)
    ulE.appendChild(li)
  }
  contact.appendChild(ulE)
  root.appendChild(contact)

  const back = el('button', 'back-to-orbit', '[ RETURN TO ORBIT ]')
  back.type = 'button'
  back.addEventListener('click', onBack)
  root.appendChild(back)
}
