/**
 * James Ty Portfolio — the primary command menu. ⚜ cursor glyph, staggered slam-in,
 * springy hover, roving-focus keyboard navigation.
 */

import { animate, createSpring } from 'animejs'
import { sections } from '../data/content'
import { sfx } from '../engine/audio'

export class Menu {
  private buttons: HTMLButtonElement[] = []
  private activeIndex = -1

  constructor(private onCommand: (id: string) => void) {}

  render() {
    const list = document.getElementById('menu-list')
    if (!list) return
    sections.forEach((s, i) => {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'menu-item'
      b.dataset.section = s.id
      b.innerHTML =
        `<span class="menu-cursor" aria-hidden="true">⚜</span>` +
        `<span class="menu-num" aria-hidden="true">0${i + 1}</span>` +
        `<span class="menu-label">${s.label}</span>` +
        `<span class="menu-rule" aria-hidden="true"></span>`
      b.addEventListener('click', () => this.onCommand(s.id))
      b.addEventListener('pointerenter', () => this.setActive(i))
      b.addEventListener('focus', () => this.setActive(i))
      li.appendChild(b)
      list.appendChild(li)
    })
    this.buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('.menu-item'))

    // Springy press feedback on every command.
    this.buttons.forEach((b) => {
      b.addEventListener('pointerdown', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        animate(b, { scale: 0.965, duration: 90, ease: 'outQuad' })
      })
      b.addEventListener('pointerup', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        animate(b, { scale: 1, ease: createSpring({ stiffness: 380, damping: 24 }) })
      })
    })

    // Roving keyboard: arrows move selection, Home/End jump, Enter clicks.
    list.addEventListener('keydown', (e: KeyboardEvent) => {
      const total = this.buttons.length
      let next: number | null = null
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (this.activeIndex + 1 + total) % total
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (this.activeIndex - 1 + total) % total
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = total - 1
      if (next !== null) {
        e.preventDefault()
        this.setActive(next)
        this.buttons[next].focus()
      }
    })
  }

  setActive(i: number) {
    if (i === this.activeIndex) return
    this.activeIndex = i
    this.buttons.forEach((b, j) => b.classList.toggle('is-active', j === i))
    sfx.move()
  }

  /** Focus the first command without scrolling (keyboard entry point). */
  focusFirst() {
    this.buttons[0]?.focus({ preventScroll: true })
  }
}
