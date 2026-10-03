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
    await page.waitForSelector('.lesson-pane .lesson-intro')
  }
  for (const id of ids) {
    await open(id)
    const intro = page.locator('.lesson-intro')
    assert.equal(await intro.count(), 1, `${id}: one unified guided intro`)
    assert.equal(await page.locator('.lesson-intro.collapsed').count(), 0, `${id}: intro starts open`)
    assert.equal(await intro.locator('code').count(), 0, `${id}: no code during warm-up`)
    const chapters = intro.locator('.intro-chapter')
    assert.equal(await chapters.count(), 2, `${id}: warm-up and core-demo chapters`)
    assert.match(await chapters.first().getAttribute('class'), /active/, `${id}: warm-up chapter starts active`)
    const warmSteps = Number(/(\d+) steps/.exec(await chapters.first().innerText())[1])
    const slider = intro.locator('input[type="range"]')
    await slider.fill(String(warmSteps - 1))
    assert.equal(await intro.locator('.wt-check').count(), 1, `${id}: warm-up ends with a prediction check`)
    await chapters.nth(1).click()
    if (id === 'np-pairwise') {
      assert.equal(await intro.locator('.pairwise').count(), 1, `${id}: bespoke demo opens from the chapter bar`)
      await intro.getByRole('button', { name: 'Next →', exact: true }).click()
      assert.match(await intro.innerText(), /Subtract coordinates/)
    } else {
      assert.match(await intro.locator('.wt-scrubber').innerText(), /Demo step 1/, `${id}: chapter bar jumps to the demo`)
      const max = await slider.getAttribute('max')
      await slider.fill(max)
      assert.equal(await intro.locator('.wt-reflect').count(), 1, `${id}: reflection appears at the end`)
      await intro.getByRole('button', { name: '← Back', exact: true }).click()
      assert.equal(await slider.inputValue(), String(Number(max) - 1))
      await intro.getByRole('button', { name: 'Restart', exact: true }).click()
      assert.equal(await slider.inputValue(), '0')
      assert.match(await chapters.first().getAttribute('class'), /active/, `${id}: restart returns to the warm-up`)
    }
    assert.equal(await intro.locator('code').count(), 0, `${id}: playback never reveals code`)
  }
  console.log(`✓ All ${ids.length} lessons render one unified intro, step correctly, and keep code hidden`)

  console.log('Collapse, remembered per lesson')
  await open('np-shapes')
  await page.locator('.lesson-intro').getByRole('button', { name: /Skip to the exercise/ }).click()
  assert.equal(await page.locator('.lesson-intro.collapsed').count(), 1, 'skip collapses the intro')
  // zustand persists to IndexedDB asynchronously; wait for the save before reloading
  await page.waitForFunction(async () => {
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
      return stored && JSON.parse(stored).state.intro['np-shapes'] === 'collapsed'
    } finally { db.close() }
  })
  await page.reload()
  await page.waitForSelector('.lesson-intro.collapsed')
  await open('np-broadcast')
  assert.equal(await page.locator('.lesson-intro.collapsed').count(), 0, 'other lessons stay open')
  await open('np-shapes')
  await page.locator('.lesson-intro').getByRole('button', { name: 'Show the intro' }).click()
  assert.equal(await page.locator('.lesson-intro.collapsed').count(), 0, 'the intro can be reopened')
  console.log('✓ Intro collapse is per lesson and survives a reload')

  console.log('Playback, checks, remembered speed, moving tiles')
  await open('np-pairwise')
  const foundation = page.locator('.lesson-intro')
  await foundation.locator('select').selectOption('1500')
  await foundation.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.lesson-intro .wt-scrubber input')?.value === '1')
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
  const lab = page.locator('.lesson-intro')
  assert.equal(await lab.locator('select').inputValue(), '1500', 'playback speed is remembered across lessons')
  await lab.locator('.intro-chapter').nth(1).click()
  const before = await lab.locator('[data-cell-id="d"]').getAttribute('style')
  await lab.getByRole('button', { name: 'Next →', exact: true }).click()
  assert.notEqual(await lab.locator('[data-cell-id="d"]').getAttribute('style'), before, 'reshaping moves the same tile')
  await lab.getByRole('button', { name: 'Restart', exact: true }).click()
  await lab.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.lesson-intro .wt-scrubber input')?.value === '1')
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
    await page.locator('.intro-chapter').nth(1).click()
    for (let i = 0; i < 2; i++) await page.locator('.hint-actions button').first().click()
    assert.equal(await page.locator('.lesson-pane .lesson-intro code').count(), 0, `${id}: hints do not unlock code`)
    await page.locator('.hint-actions button').first().click()
    assert.equal(await page.locator('.lesson-pane .lesson-intro code').count(), 0, `${id}: confirmation does not unlock code`)
    await page.getByRole('button', { name: 'Yes, show it', exact: true }).click()
    assert.ok(await page.locator('.lesson-pane .lesson-intro code').count() > 0, `${id}: explicit reveal unlocks code`)
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
    await page.waitForSelector('.lesson-pane .lesson-intro')
    await page.locator('.intro-chapter').nth(1).click()
    await page.waitForSelector('.lesson-pane .lesson-intro code', { state: 'attached' })
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
  const pipeline = page.locator('.lesson-intro')
  await pipeline.locator('.intro-chapter').nth(1).click()
  for (let i = 0; i < 3; i++) await pipeline.getByRole('button', { name: 'Next →', exact: true }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${shots}/03-pandas.png` })
  assert.deepEqual(errors, [], 'no page errors')
  console.log(`✓ All ${ids.length} mobile layouts fit; no page errors`)
} catch (error) {
  if (page) {
    console.log('Failed page:', page.url(), 'solution cards:', await page.locator('.hint-card.solution').count(), 'intro code:', await page.locator('.lesson-pane .lesson-intro code').count())
    await page.screenshot({ path: `${shots}/99-failure.png` }).catch(() => {})
  }
  throw error
} finally {
  await browser?.close()
  server.kill()
}
