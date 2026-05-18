/**
 * Boot sequence: typewriter TY-OS lines, skippable, once per session.
 * Resolves `done` when the terminal hands over the ship.
 */
import { bootLines, profile } from '../data/content'

export class BootSequence {
  private el = document.getElementById('boot') as HTMLDivElement
  private text = document.getElementById('boot-text') as HTMLPreElement
  private skipBtn = document.getElementById('boot-skip') as HTMLButtonElement
  private skipped = false
  private timers: number[] = []
  readonly reducedMotion: boolean
  private resolveDone!: () => void
  readonly done: Promise<void>

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion
    this.done = new Promise((res) => (this.resolveDone = res))

    const seen = sessionStorage.getItem('ty-stellar-booted')
    if (seen || reducedMotion) {
      this.finish(0)
      return
    }

    const lines = [...bootLines, `${profile.bootByline}`, '']
    let delay = 300
    const charDelay = 14
    const lineDelay = 260

    lines.forEach((line, li) => {
      if (!line) {
        delay += lineDelay
        return
      }
      for (let c = 0; c <= line.length; c++) {
        const snapshot = li
        const slice = c
        this.timers.push(
          window.setTimeout(() => {
            // Rebuild the full text up to this point.
            let out = ''
            for (let j = 0; j < snapshot; j++) out += (lines[j] || '') + '\n'
            out += lines[snapshot].slice(0, slice)
            this.text.textContent = out
          }, delay)
        )
        delay += charDelay
      }
      delay += lineDelay
    })

    const total = delay + 400
    this.timers.push(window.setTimeout(() => this.finish(500), total))

    this.skipBtn.addEventListener('click', () => this.finish(200))
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('pointerdown', this.onKey)
  }

  private onKey = (): void => {
    this.finish(200)
  }

  private finish(fadeMs: number): void {
    if (this.skipped) return
    this.skipped = true
    for (const t of this.timers) clearTimeout(t)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('pointerdown', this.onKey)
    sessionStorage.setItem('ty-stellar-booted', '1')
    // Show the full log instantly on skip.
    this.text.textContent = bootLines.join('\n') + '\n' + profile.bootByline
    this.el.classList.add('done')
    window.setTimeout(() => {
      this.el.remove()
      this.resolveDone()
    }, fadeMs)
  }
}
