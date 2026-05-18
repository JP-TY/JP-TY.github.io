/**
 * HUD readouts + bottom nav strip.
 */
import { sections } from '../data/content'

const FLAVOR: Record<string, string[]> = {
  about: ['> reading pilot file…', '> origin: cebu city', '> sun core stable'],
  projects: ['> scanning planetary works…', '> 5 moons detected', '> all dossiers verified'],
  experience: ['> decoding mission logs…', '> 5 postings found', '> crew morale: high'],
  achievements: ['> loading high scores…', '> insert coin', '> records verified'],
  skills: ['> inspecting cargo manifest…', '> all systems operational', '> cargo sealed'],
  contact: ['> opening channel…', '> relay listening', '> awaiting transmission'],
}

export class Hud {
  private log = document.getElementById('mission-log') as HTMLParagraphElement
  private target = document.getElementById('hud-target') as HTMLParagraphElement
  private coords = document.getElementById('hud-coords') as HTMLParagraphElement
  private nav = document.getElementById('nav') as HTMLElement
  private flavorTimer: number | null = null

  constructor(
    onNavigate: (id: string) => void,
    private sound: { hover(): void }
  ) {
    for (const section of sections) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = section.label
      btn.dataset.nav = section.id
      btn.style.setProperty('--nav-accent', `var(${section.accentVar})`)
      btn.addEventListener('click', () => onNavigate(section.id))
      this.nav.appendChild(btn)
    }
  }

  setActive(id: string | null): void {
    for (const btn of this.nav.querySelectorAll<HTMLButtonElement>('button[data-nav]')) {
      btn.classList.toggle('active', btn.dataset.nav === id)
      btn.setAttribute('aria-current', btn.dataset.nav === id ? 'true' : 'false')
    }
  }

  setTarget(label: string | null, accent?: string): void {
    if (label) {
      this.target.textContent = `▸ ${label}`
      this.target.style.color = accent ?? 'var(--green)'
    } else {
      this.target.textContent = '— none —'
      this.target.style.color = ''
    }
  }

  setCoords(x: number, y: number): void {
    this.coords.textContent = `X ${String(Math.round(x)).padStart(4, '0')} · Y ${String(Math.round(y)).padStart(4, '0')}`
  }

  /** Cycle in-fiction flavor lines for the docked section. */
  playFlavor(id: string): void {
    if (this.flavorTimer) window.clearInterval(this.flavorTimer)
    const lines = FLAVOR[id] ?? []
    let i = 0
    this.log.textContent = lines[0] ?? ''
    this.flavorTimer = window.setInterval(() => {
      i = (i + 1) % Math.max(lines.length, 1)
      if (lines[i]) this.log.textContent = lines[i]
    }, 3200)
  }

  message(text: string): void {
    if (this.flavorTimer) {
      window.clearInterval(this.flavorTimer)
      this.flavorTimer = null
    }
    this.log.textContent = `> ${text}`
  }

  idle(): void {
    if (this.flavorTimer) {
      window.clearInterval(this.flavorTimer)
      this.flavorTimer = null
    }
    this.log.textContent = '> systems nominal. exploring…'
  }

  reveal(): void {
    document.getElementById('hud')?.classList.remove('hud-hidden')
    this.nav.classList.remove('nav-hidden')
  }

  tick(): void {
    this.sound.hover()
  }
}
