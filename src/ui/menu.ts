import { sections } from '../data/content'
import type { RouteId } from '../engine/router'
import { blip } from '../engine/audio'

export interface GrandMenuOpts {
  hover: { index: number | null }
  onSelect: (r: RouteId) => void
}

/** Full-screen Persona-style grand menu with roving focus. */
export function renderGrandMenu(opts: GrandMenuOpts): void {
  const list = document.getElementById('menu-list')
  if (!list) return
  list.setAttribute('role', 'menu')
  list.innerHTML = ''
  sections.forEach((s, idx) => {
    const li = document.createElement('li')
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'grand-row'
    btn.dataset.route = s.id
    btn.setAttribute('role', 'menuitem')
    btn.tabIndex = idx === 0 ? 0 : -1
    btn.innerHTML = `<span class="grand-index" aria-hidden="true">0${idx + 1}</span><span class="grand-label">${s.label}</span>`
    const go = () => {
      blip(660, 50)
      opts.onSelect(s.id as RouteId)
    }
    btn.addEventListener('click', go)
    btn.addEventListener('mouseenter', () => {
      opts.hover.index = idx
    })
    btn.addEventListener('mouseleave', () => {
      if (opts.hover.index === idx) opts.hover.index = null
    })
    btn.addEventListener('focus', () => {
      opts.hover.index = idx
    })
    btn.addEventListener('blur', () => {
      if (opts.hover.index === idx) opts.hover.index = null
    })
    btn.addEventListener('keydown', (e) => {
      const rows = [...list.querySelectorAll<HTMLButtonElement>('.grand-row')]
      const at = rows.indexOf(btn)
      const move = (dir: 1 | -1) => {
        e.preventDefault()
        const target = rows[(at + dir + rows.length) % rows.length]
        rows.forEach((r) => (r.tabIndex = -1))
        target.tabIndex = 0
        target.focus()
      }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 's' || k === 'd' || k === 'j' || k === 'l') {
        move(1)
      } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'w' || k === 'a' || k === 'k' || k === 'h') {
        move(-1)
      } else if (k === 'Enter' || k === ' ') {
        e.preventDefault()
        go()
      } else if (/^[1-6]$/.test(e.key)) {
        e.preventDefault()
        const target = rows[Number(e.key) - 1]
        target?.focus()
        target?.click()
      }
    })
    li.appendChild(btn)
    list.appendChild(li)
  })
}
