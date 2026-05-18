/* Visual QA driver: boots the site, drives interactions, captures screenshots. */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173/'
const shot = (page, name) => page.screenshot({ path: `/tmp/qa-${name}.png` })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`)
})

await page.goto(BASE)
await page.waitForTimeout(800)
await page.keyboard.press('Escape') // skip boot
await page.waitForTimeout(1200)
await shot(page, '01-scene')

// Hover the sun (center of screen)
await page.mouse.move(720, 450)
await page.waitForTimeout(400)
await shot(page, '02-hover-sun')

// Nav: click PROJECTS -> autopilot flight + dock
await page.click('#nav button[data-nav="projects"]')
await page.waitForTimeout(2500)
await shot(page, '03-projects-docked')

// ESC undock
await page.keyboard.press('Escape')
await page.waitForTimeout(800)

// Contact panel
await page.click('#nav button[data-nav="contact"]')
await page.waitForTimeout(2500)
await shot(page, '04-contact-docked')
await page.keyboard.press('Escape')
await page.waitForTimeout(600)

// Classic mode
await page.click('#toggle-classic')
await page.waitForTimeout(600)
await shot(page, '05-classic-top')
await page.evaluate(() => window.scrollTo(0, 2400))
await page.waitForTimeout(400)
await shot(page, '06-classic-mid')
await page.click('#classic .back-to-orbit')
await page.waitForTimeout(600)

// Mouse-follow rocket + exhaust while moving
for (let i = 0; i < 20; i++) {
  await page.mouse.move(200 + i * 50, 700 - i * 25)
  await page.waitForTimeout(16)
}
await shot(page, '07-rocket-flight')

// Mobile viewport
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
await mobile.goto(BASE)
await mobile.waitForTimeout(800)
await mobile.keyboard.press('Escape')
await mobile.waitForTimeout(1000)
await shot(mobile, '08-mobile-scene')
await mobile.click('#nav button[data-nav="skills"]')
await mobile.waitForTimeout(2500)
await shot(mobile, '09-mobile-panel')

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'NO CONSOLE ERRORS')
await browser.close()
