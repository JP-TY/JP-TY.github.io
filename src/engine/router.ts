/** Hash router: #/menu, #/profile, #/systems, #/skills, #/experience, #/recognition, #/contact */

export type RouteId =
  | 'menu'
  | 'profile'
  | 'systems'
  | 'skills'
  | 'experience'
  | 'recognition'
  | 'contact'

export const ROUTES: RouteId[] = [
  'menu',
  'profile',
  'systems',
  'skills',
  'experience',
  'recognition',
  'contact',
]

export function currentRoute(): RouteId {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return (ROUTES as string[]).includes(raw) ? (raw as RouteId) : 'menu'
}

export function navigate(route: RouteId): void {
  if (currentRoute() === route) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = `#/${route}`
}

export function onRouteChange(fn: (route: RouteId) => void): () => void {
  const handler = () => fn(currentRoute())
  window.addEventListener('hashchange', handler)
  return () => window.removeEventListener('hashchange', handler)
}
