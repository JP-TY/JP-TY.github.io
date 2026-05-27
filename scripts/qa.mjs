/**
 * TY ROYALE — QA smoke test. Static server on dist/, real browser flow:
 * title → hub → sections → deep links → sound toggle → mobile → screenshots.
 * Fails on any console error. Run: node scripts/qa.mjs (after npm run build).
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const ROOT = new URL('../dist', import.meta.url).pathname
const PORT = 4173
const SHOTS = new URL('./shots/', import.meta.url).pathname
mkdirSync(SHOTS, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }

const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0].split('#')[0]
  const file = path === '/' || path.startsWith('/#') ? 'index.html' : path.slice(1)
  try {
    const data = await readFile(join(ROOT, file))
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    const data = await readFile(join(ROOT, 'index.html'))
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(data)
  }
})

const failures = []
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗ FAIL'} ${label}`)
  if (!cond) failures.push(label)
}

await new Promise((ok) => server.listen(PORT, ok))
const browser = await chromium.launch()

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}

// ---- 1. First visit: title screen → hub ----
{
  const { ctx, page, errors } = await newPage()
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForSelector('#boot:not([hidden])')
  // The module letter-splits the title (space → &nbsp;) and arms skip listeners;
  // wait for that marker before asserting or pressing keys.
  await page.waitForSelector('.boot-letter')
  check(
    (await page.textContent('#boot-title'))?.replace(/\u00A0/g, ' ').includes('JAMES TY'),
    'title screen shows JAMES TY',
  )
  await page.keyboard.press('Enter')
  await page.waitForSelector('#app:not([hidden])', { timeout: 5000 })
  check(await page.isVisible('#hub'), 'hub visible after skipping title')
  check((await page.locator('.menu-item').count()) === 6, 'six menu commands rendered')
  await page.waitForFunction(() => document.querySelector('[data-stat="projects"]')?.textContent === '5', { timeout: 5000 })
  // Counters roll in staggered; wait for the last one before asserting all three.
  await page.waitForFunction(() => document.querySelector('[data-stat="certs"]')?.textContent === '8', { timeout: 5000 })
  check((await page.textContent('#char-stats [data-stat="projects"]')) === '5', 'stat projects = 5')
  check((await page.textContent('#char-stats [data-stat="awards"]')) === '8', 'stat awards = 8')
  check((await page.textContent('#char-stats [data-stat="certs"]')) === '8', 'stat certs = 8')
  await page.focus('.menu-item')
  await page.keyboard.press('ArrowDown')
  check((await page.textContent('.menu-item.is-active .menu-label')) === 'PROJECTS', 'arrow keys move selection')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#view:not([hidden])', { timeout: 5000 })
  check((await page.textContent('#view-heading')) === 'Projects', 'projects section opens via keyboard')
  const body = await page.textContent('#view-body')
  check(body.includes('CreditPass') && body.includes('LakbAI') && body.includes('GreenPoint'), 'project dossiers present')
  check((await page.locator('#view-body .project-award').count()) >= 5, 'projects list their awards')
  await page.keyboard.press('Escape')
  await page.waitForSelector('#hub:not([hidden])', { timeout: 5000 })
  check(await page.isVisible('#hub'), 'Escape returns to the hub')
  await page.waitForTimeout(1300) // let the return wipe fully clear before capturing
  await page.screenshot({ path: join(SHOTS, 'hub.png') })
  check(errors.length === 0, `zero console errors on main flow${errors.length ? ` → ${errors[0]}` : ''}`)
  await ctx.close()
}

// ---- 2. Deep links + section content ----
const SECTIONS = [
  ['about', 'About', 'University of the Philippines Cebu'],
  ['projects', 'Projects', 'CreditPass'],
  ['experience', 'Experience', 'ISCOLab'],
  ['achievements', 'Achievements', 'Philippines Junior Data Science Challenge'],
  ['skills', 'Skills', 'TypeScript'],
  ['contact', 'Contact', 'jamesty016@gmail.com'],
]
{
  const { ctx, page, errors } = await newPage()
  for (const [id, heading, mustContain] of SECTIONS) {
    await page.goto(`http://localhost:${PORT}/#/${id}`)
    // Wait on content, not on the hidden attribute: after the first section
    // opens, #view stays un-hidden and same-document hash changes resolve
    // goto() before the wipe finishes populating the new section.
    await page.waitForFunction(
      (h) => document.querySelector('#view-heading')?.textContent === h,
      heading,
      { timeout: 5000 },
    )
    const h = await page.textContent('#view-heading')
    const b = await page.textContent('#view-body')
    check(h === heading && b.includes(mustContain), `deep link #/${id} → "${heading}" with real content`)
    await page.waitForTimeout(1300) // let the opening wipe fully clear before capturing
    await page.screenshot({ path: join(SHOTS, `section-${id}.png`) })
  }
  check(await page.isHidden('#boot'), 'deep link skips title screen (recruiter path)')
  check(errors.length === 0, `zero console errors across all deep links${errors.length ? ` → ${errors[0]}` : ''}`)
  await ctx.close()
}

// ---- 3. Sound toggle ----
{
  const { ctx, page } = await newPage()
  await page.goto(`http://localhost:${PORT}/#/menu`)
  // #/menu on a fresh session shows the title screen by design — skip it.
  await page.waitForSelector('.boot-letter')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#app:not([hidden])')
  await page.click('#sound-toggle')
  check((await page.textContent('#sound-toggle')) === '[ SOUND: ON ]', 'sound toggle flips to ON')
  check((await page.getAttribute('#sound-toggle', 'aria-pressed')) === 'true', 'aria-pressed=true when on')
  await ctx.close()
}

// ---- 4. Mobile stacking ----
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/#/menu`)
  await page.waitForSelector('.boot-letter')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#app:not([hidden])')
  const stacked = await page.evaluate(() => {
    const menu = document.querySelector('#menu')?.getBoundingClientRect()
    const card = document.querySelector('#charcard')?.getBoundingClientRect()
    return menu && card ? card.top >= menu.bottom - 4 : false
  })
  check(stacked, 'mobile: character card stacks below menu')
  await page.screenshot({ path: join(SHOTS, 'mobile-hub.png') })
  await ctx.close()
}

await browser.close()
server.close()
console.log(failures.length === 0 ? '\nALL CHECKS PASSED 👑' : `\n${failures.length} CHECK(S) FAILED`)
process.exit(failures.length === 0 ? 0 : 1)

