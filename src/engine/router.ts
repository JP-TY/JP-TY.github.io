/**
 * James Ty Portfolio — hash router. Screens: '' (title), '#/menu', '#/<section-id>'.
 * Deep links land directly on the target document (recruiter path).
 * Popstate/back-forward work; unknown hashes resolve to the menu.
 */

export type RouteHandler = (id: string) => void

const VALID_IDS = new Set(['about', 'projects', 'experience', 'achievements', 'skills', 'contact'])

export function parseHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, '').trim()
  if (raw === '') return 'title'
  if (raw === 'menu') return 'menu'
  if (VALID_IDS.has(raw)) return raw
  return 'unknown'
}

export class Router {
  private handler: RouteHandler
  private current: string | null = null

  constructor(handler: RouteHandler) {
    this.handler = handler
  }

  get id() {
    return this.current
  }

  /** Install listeners and run the initial resolution. */
  start() {
    window.addEventListener('hashchange', () => {
      const id = parseHash()
      if (id === 'unknown') {
        // Normalize bad deep links to the menu without firing a loop.
        if (window.location.hash !== '#/menu') window.location.replace('#/menu')
        return
      }
      this.dispatch(id)
    })
    this.dispatch(parseHash())
  }

  /** Navigate by changing the hash (keeps back/forward semantics). */
  go(id: 'menu' | 'title' | string) {
    const target = id === 'title' ? '' : `#/${id}`
    if (window.location.hash === target || (target === '' && window.location.hash === '')) {
      this.dispatch(id)
    } else {
      window.location.hash = target
    }
  }

  private dispatch(id: string) {
    if (id === this.current) return
    this.current = id
    this.handler(id)
  }
}
