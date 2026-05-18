/**
 * Panel controller: docking choreography for the transmission panels.
 * Dock = shake → panel reveal. Undock = faster exit, focus returned.
 */
import { animate } from 'animejs'
import { sectionById } from './panel-content'

export interface PanelCallbacks {
  onOpen(id: string): void
  onClose(): void
}

export class PanelController {
  private panels: Map<string, HTMLElement>
  private openId: string | null = null
  private lastFocus: HTMLElement | null = null
  private reducedMotion: boolean
  private cb: PanelCallbacks
  /** Set when a specific moon/project should scroll into view on open. */
  pendingProject: string | null = null

  constructor(panels: Map<string, HTMLElement>, reducedMotion: boolean, cb: PanelCallbacks) {
    this.panels = panels
    this.reducedMotion = reducedMotion
    this.cb = cb
    for (const [id, panel] of panels) {
      panel.querySelector(`[data-undock="${id}"]`)?.addEventListener('click', () => this.close())
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openId) this.close()
    })
  }

  get isOpen(): boolean {
    return this.openId !== null
  }

  get current(): string | null {
    return this.openId
  }

  open(id: string): void {
    const section = sectionById(id)
    const panel = this.panels.get(id)
    if (!section || !panel) return
    if (this.openId === id) return
    if (this.openId) this.closeNow()

    this.openId = id
    this.lastFocus = document.activeElement as HTMLElement
    panel.hidden = false
    document.body.classList.add('shaking')
    window.setTimeout(() => document.body.classList.remove('shaking'), 260)

    if (this.reducedMotion) {
      animate(panel, { opacity: [0, 1], duration: 1 })
    } else {
      animate(panel, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 350,
        ease: 'out(3)',
      })
    }

    // Scroll to a pending project dossier (moon dock).
    if (this.pendingProject) {
      const target = panel.querySelector(`#project-${this.pendingProject}`)
      if (target) target.scrollIntoView({ block: 'start' })
      this.pendingProject = null
    } else {
      panel.scrollTop = 0
    }

    panel.focus({ preventScroll: true })
    this.cb.onOpen(id)
  }

  close(): void {
    if (!this.openId) return
    const id = this.openId
    const panel = this.panels.get(id)
    this.openId = null
    this.cb.onClose()

    if (!panel) return
    const done = (): void => {
      panel.hidden = true
      this.lastFocus?.focus({ preventScroll: true })
      const navBtn = document.querySelector<HTMLButtonElement>(`#nav [data-nav="${id}"]`)
      navBtn?.focus({ preventScroll: true })
    }
    if (this.reducedMotion) {
      done()
    } else {
      animate(panel, {
        opacity: [1, 0],
        scale: [1, 0.97],
        duration: 250,
        ease: 'in(2)',
        onComplete: done,
      })
    }
  }

  private closeNow(): void {
    const panel = this.panels.get(this.openId!)
    if (panel) panel.hidden = true
    this.openId = null
  }
}
