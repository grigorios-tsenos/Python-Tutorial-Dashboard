// Runs against the production build. Usage: npm run build && node tests/e2e/walkthroughs.mjs
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const port = 4181
const url = `http://localhost:${port}`
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
const shots = process.env.SHOTS_DIR || '/tmp/orbit-walkthrough-shots'
mkdirSync(shots, { recursive: true })
let browser
let page
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  const lessons = readdirSync('src/content/lessons').flatMap(track => readdirSync(`src/content/lessons/${track}`).map(file => {
    const source = readFileSync(`src/content/lessons/${track}/${file}`, 'utf8')
    return { id: /^id: (.+)$/m.exec(source)[1], title: /^title: (.+)$/m.exec(source)[1].replace(/^(['"])(.*)\1$/, '$2') }
  }))
  const ids = lessons.map(lesson => lesson.id)
  const open = async id => {
    await page.evaluate(id => { location.hash = `#/lesson/${id}` }, id)
    await page.waitForFunction(title => document.querySelector('.lesson-pane header h1')?.textContent === title, lessons.find(lesson => lesson.id === id).title)
    await page.waitForSelector('.lesson-pane > .lab')
  }
  for (const id of ids) {
    await open(id)
    const warmup = page.locator('.lesson-warmup')
    assert.equal(await warmup.count(), 1, `${id}: prerequisite warm-up`)
    assert.equal(await warmup.getAttribute('open'), '', `${id}: warm-up starts visible`)
    assert.equal(await warmup.locator('code').count(), 0)
    const slider = warmup.locator('input[type="range"]')
    await slider.fill(await slider.getAttribute('max'))
    assert.equal(await warmup.locator('.wt-check').count(), 1)
    await warmup.getByRole('button', { name: 'Continue to the full example →' }).click()
    assert.equal(await warmup.getAttribute('open'), null)
    const lab = page.locator('.lesson-pane > .lab')
    assert.equal(await lab.count(), 1, `${id}: one walkthrough`)
    assert.equal(await lab.locator('code').count(), 0, `${id}: solution code hidden`)
    if (id === 'np-pairwise') {
      await lab.getByRole('button', { name: 'Next →', exact: true }).click()
      assert.match(await lab.innerText(), /Subtract coordinates/)
    } else {
      for (let i = 0; i < 3; i++) await lab.getByRole('button', { name: 'Next →', exact: true }).click()
      assert.equal(await lab.locator('.wt-scrubber input').inputValue(), '3', `${id}: reaches final step`)
      assert.equal(await lab.locator('.wt-reflect').count(), 1, `${id}: reflection appears`)
      await lab.getByRole('button', { name: '← Back', exact: true }).click()
      assert.equal(await lab.locator('.wt-scrubber input').inputValue(), '2')
      await lab.getByRole('button', { name: 'Restart', exact: true }).click()
      assert.equal(await lab.locator('.wt-scrubber input').inputValue(), '0')
    }
    assert.equal(await lab.locator('code').count(), 0, `${id}: playback never reveals code`)
  }
  console.log(`✓ All ${ids.length} lessons render, step correctly, and keep walkthrough code hidden`)

  await open('np-pairwise')
  const foundation = page.locator('.foundation-player')
  await foundation.locator('select').selectOption('1500')
  await foundation.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.foundation-player .wt-scrubber input')?.value === '1')
  await page.waitForTimeout(1700)
  assert.equal(await foundation.locator('input[type="range"]').inputValue(), '1', 'unanswered prediction pauses playback')
  await foundation.locator('.wt-check button').first().click()
  assert.match(await foundation.locator('[role="status"]').innerText(), /Try again/)
  await foundation.locator('.wt-check button').nth(1).click()
  assert.match(await foundation.locator('[role="status"]').innerText(), /Yes/)
  await foundation.locator('input[type="range"]').fill('3')
  await foundation.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${shots}/05-singleton-basics.png` })
  await open('np-shapes')
  const lab = page.locator('.walkthrough')
  const before = await lab.locator('[data-cell-id="d"]').getAttribute('style')
  await lab.getByRole('button', { name: 'Next →', exact: true }).click()
  assert.notEqual(await lab.locator('[data-cell-id="d"]').getAttribute('style'), before, 'reshaping moves the same tile')
  await lab.getByRole('button', { name: 'Restart', exact: true }).click()
  await lab.locator('select').selectOption('1500')
  await lab.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.walkthrough .wt-scrubber input')?.value === '1')
  await lab.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.waitForTimeout(1700)
  assert.equal(await lab.locator('.wt-scrubber input').inputValue(), '1', 'pause stops playback')
  await page.screenshot({ path: `${shots}/01-array.png` })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await lab.locator('.wt-cell').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s')
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  for (const id of ['np-shapes', 'pd-pipeline', 'np-pairwise']) {
    console.log(`Checking saved solution reveal: ${id}`)
    await open(id)
    for (let i = 0; i < 2; i++) await page.locator('.hint-actions button').first().click()
    assert.equal(await page.locator('.lesson-pane > .lab code').count(), 0, `${id}: hints do not unlock code`)
    await page.locator('.hint-actions button').first().click()
    assert.equal(await page.locator('.lesson-pane > .lab code').count(), 0, `${id}: confirmation does not unlock code`)
    await page.getByRole('button', { name: 'Yes, show it', exact: true }).click()
    assert.ok(await page.locator('.lesson-pane > .lab code').count() > 0, `${id}: explicit reveal unlocks code`)
    // Wait for the app's asynchronous IndexedDB save before testing a fresh load.
    await page.waitForFunction(async id => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      try {
        const stored = await new Promise((resolve, reject) => {
          const request = db.transaction('keyval').objectStore('keyval').get('orbit-progress')
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        return stored && JSON.parse(stored).state.hints[id] === 3
      } finally { db.close() }
    }, id)
    await page.reload()
    await page.waitForSelector('.lesson-pane > .lab code', { state: 'attached' })
  }
  console.log('✓ Same tiles move, playback pauses, reduced motion works, and only solution reveal unlocks code (also after reload)')

  await page.setViewportSize({ width: 390, height: 844 })
  for (const id of ids) {
    await open(id)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: mobile has no page overflow`)
  }
  await open('lg-memory')
  await page.screenshot({ path: `${shots}/02-mobile-messages.png` })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await open('pd-pipeline')
  const pipeline = page.locator('.walkthrough')
  for (let i = 0; i < 3; i++) await pipeline.getByRole('button', { name: 'Next →', exact: true }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${shots}/03-pandas.png` })
  assert.deepEqual(errors, [], 'no page errors')
  console.log('✓ All 48 mobile layouts fit; no page errors')
} catch (error) {
  if (page) {
    console.log('Failed page:', page.url(), 'solution cards:', await page.locator('.hint-card.solution').count(), 'walkthrough code:', await page.locator('.lesson-pane > .lab code').count())
    await page.screenshot({ path: `${shots}/99-failure.png` }).catch(() => {})
  }
  throw error
} finally {
  await browser?.close()
  server.kill()
}
