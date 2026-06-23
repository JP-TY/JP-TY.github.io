/** Minimal QA: build artifact + token + a11y smoke checks. */
import { existsSync, readFileSync } from 'node:fs'

const fail = (msg) => {
  console.error(`QA FAIL: ${msg}`)
  process.exitCode = 1
}
const pass = (msg) => console.log(`QA PASS: ${msg}`)

if (!existsSync('dist/index.html')) fail('dist/index.html missing — run npm run build first')
else {
  const html = readFileSync('dist/index.html', 'utf8')
  if (!html.includes('Skip to content')) fail('skip link missing')
  else pass('skip link present')
  if (!html.includes('TY.OS')) fail('sysbar brand missing')
  else pass('brand present')
}

const cssPaths = ['src/styles/main.css']
let cssAll = ''
for (const p of cssPaths) {
  const css = readFileSync(p, 'utf8')
  cssAll += css
  for (const token of ['--ink', '--amber', '--font-display', '#scanlines', '#vignette', '#aurora', 'veil-flash', 'crt-blink', 'grand-menu', 'menu-drawer', 'menu-tab', 'drawer-open', 'star-map', 'star-field', 'star-dust', 'star-const', 'hex-label', 'map-hint', 'page-screen', 'menu-screen', 'route-skills']) {
    if (!css.includes(token)) fail(`${p} missing ${token}`)
  }
  for (const ban of ['#250505', 'Cinzel', 'linear-gradient(135deg, #a855f7']) {
    if (css.includes(ban)) fail(`${p} contains retired token ${ban}`)
  }
  if (!css.includes('prefers-reduced-motion')) fail(`${p} missing reduced-motion`)
  if (!css.includes('overflow-x: clip')) fail(`${p} missing overflow-x clip`)
  if (!css.includes(':focus-visible')) fail(`${p} missing focus-visible`)
}
if (process.exitCode !== 1) pass('tokens, bans, a11y guards ok')

const tealLeftovers = (cssAll.match(/#5eead4|var\(--teal\)/gi) || []).length
if (tealLeftovers > 0) fail(`teal remnants in stylesheet (${tealLeftovers})`)
else pass('no teal remnants')

const portraitSrc = readFileSync('src/engine/portrait.ts', 'utf8')
if (!portraitSrc.includes('prefers-reduced-motion')) fail('portrait missing reduced-motion guard')
else pass('portrait reduced-motion safe')
if (portraitSrc.includes('BAYER')) fail('portrait still quantizes (artifact source)')
else pass('portrait grade is smooth')
if (!existsSync('public/profile.jpg')) fail('public/profile.jpg missing')
else pass('profile photo present')

const panelSrc = readFileSync('src/ui/panel-content.ts', 'utf8')
const menuSrc = readFileSync('src/ui/menu.ts', 'utf8')
const dreamSrc = readFileSync('src/engine/dream.ts', 'utf8')
for (const token of ['trophy', 'filter-btn', 'case-lid', 'badge-disc', '<h3 class="sub rise">Awards</h3>', 'star-map', 'star-node', 'lucide', 'stardust', 'constellation', 'map-hint', 'data-active']) {
  if (!panelSrc.includes(token)) fail(`recognition missing ${token}`)
}
if (process.exitCode !== 1) pass('trophy room + badge case wired')
for (const token of ['grand-row', 'dreamHover', 'navigate', 'move(1)', 'ArrowRight', 'dreamHover.index = (']) {
  if (!menuSrc.includes(token) && !readFileSync('src/main.ts', 'utf8').includes(token)) fail(`menu flow missing ${token}`)
}
if (process.exitCode !== 1) pass('grand menu flow wired')
if (!dreamSrc.includes('startDream') || !dreamSrc.includes('prefers-reduced-motion')) fail('dream engine incomplete')
else pass('dream engine present')
for (const token of ['planet', 'onSelect', 'hit', 'orbit', 'canvasLit', 'ringBand', 'ORBIT_SPEED', 'cometT', 'haloR', 'reticle', 'dimmed', 'beacon', 'padStart', 'tagPx', 'hypot(W, H)', 'fitSystem', 'sunspot', 'tick ring', 'sunClear', 'labelBoxes', 'deconflict', 'leader', 'touchstart', 'touchR', 'bestD']) {
  if (!dreamSrc.includes(token)) fail(`solar system missing ${token}`)
}
if (process.exitCode !== 1) pass('solar system wired')
const favSrc = readFileSync('src/engine/favicon.ts', 'utf8')
const mainSrc = readFileSync('src/main.ts', 'utf8')
if (!favSrc.includes('startFavicon') || !favSrc.includes('toDataURL')) fail('favicon engine incomplete')
else pass('favicon engine present')
if (!mainSrc.includes('startFavicon')) fail('favicon not wired into main')
else pass('favicon wired')
for (const token of ['setDrawer', 'wireDrawer', 'inert', 'drawer-open']) {
  if (!mainSrc.includes(token)) fail(`edge drawer missing ${token}`)
}
if (process.exitCode !== 1) pass('edge drawer wired')

const design = readFileSync('DESIGN.md', 'utf8')
if (!design.includes('Amber Voice')) fail('DESIGN.md drift')
else pass('DESIGN.md aligned')

const bootSrc = readFileSync('src/ui/boot.ts', 'utf8')
const effigySrc = readFileSync('src/engine/effigy.ts', 'utf8')
if (!bootSrc.includes('startEffigy') || !bootSrc.includes('stopEffigy')) {
  fail('boot does not start/stop the effigy')
} else pass('effigy lifecycle wired')
if (!effigySrc.includes('prefers-reduced-motion')) fail('effigy missing reduced-motion guard')
else pass('effigy reduced-motion safe')
const distHtml = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : ''
if (!distHtml.includes('id="effigy"')) fail('effigy canvas missing from built index.html')
else pass('effigy canvas present')
