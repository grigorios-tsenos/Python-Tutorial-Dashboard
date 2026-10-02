// End-to-end smoke test: drives the built app in a real Chromium (Edge) with real Pyodide.
// Usage: npm run build && node tests/e2e/smoke.mjs   (starts `vite preview` itself)
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const SHOTS = process.env.SHOTS_DIR || '/tmp/orbit-shots'
const EXEC = process.env.BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
const PORT = 4173
const URL = `http://localhost:${PORT}/`
mkdirSync(SHOTS, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(URL)).ok) break } catch {}
  await sleep(200)
}

let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '  ✓' : '  ✗ FAIL'} ${msg}`)
  if (!cond) failures++
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__backdropDraws = 0
  const clear = CanvasRenderingContext2D.prototype.clearRect
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas.classList.contains('backdrop')) window.__backdropDraws++
    return clear.apply(this, args)
  }
})
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

const dismissCelebration = async () => {
  try { await page.waitForSelector('.celebrate', { timeout: 2500 }); await page.keyboard.press('Escape'); await sleep(250) } catch {}
}
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png` })
const go = async (hash) => { await page.evaluate((h) => (location.hash = h), hash); await sleep(300) }
const backdropFrames = () => page.evaluate(async () => {
  const before = window.__backdropDraws
  for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame)
  return window.__backdropDraws - before
})
const revealSolutionAndRun = async () => {
  for (let i = 0; i < 3; i++) {
    const btn = page.locator('.hint-actions button').first()
    await btn.click()
    if (i === 2) await page.locator('.hint-actions button', { hasText: 'Yes, show it' }).click()
  }
  await page.locator('.hint-card.solution button', { hasText: 'Copy into' }).click()
  await page.locator('.btn.run').click()
}

try {
  console.log('Map')
  await page.goto(URL)
  await page.waitForSelector('.star', { timeout: 15000 })
  ok((await page.locator('.star').count()) === 64, '64 stars rendered')
  ok((await page.locator('.legend-item').count()) === 8, '8 tracks in legend')
  ok(await page.locator('.map-hero h1').innerText().then((t) => /learn ai engineering/i.test(t)), 'first-visit hero shown')
  ok(await page.locator('.difficulty-step').count() === 8, 'difficulty path shows eight stages')
  ok((await page.locator('.difficulty-step[aria-current="step"]').innerText()).includes('Guided'), 'new learners start at Guided difficulty')
  await page.evaluate(() => { for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('resize')) })
  const draws = await backdropFrames()
  ok(draws >= 10 && draws <= 14, `resize keeps one background animation loop (${draws} draws in 12 frames)`)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await backdropFrames() // allow the media-change event's static redraw to finish
  const reducedDraws = await backdropFrames()
  ok(reducedDraws === 0, `OS reduced motion stops the background animation (${reducedDraws} draws)`)
  ok(await page.locator('.star .pulse').evaluate((el) => getComputedStyle(el).animationName) === 'none', 'OS reduced motion disables map pulse')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await sleep(100)
  ok(await backdropFrames() >= 10, 'background animation resumes when reduced motion is off')
  await shot('01-map')

  console.log('Lesson: run, hints, grading, celebration')
  await page.locator('.map-hero .btn.primary').click()
  await page.waitForSelector('.cm-editor')
  ok(page.url().includes('#/lesson/np-shapes'), 'CTA opens the first lesson')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.out-verdict', { timeout: 90000 })
  ok(await page.locator('.out-verdict.fail').count() === 1, 'starter code fails its checks')
  await shot('02-lesson-fail')
  await revealSolutionAndRun()
  await page.waitForSelector('.out-verdict.pass', { timeout: 30000 })
  ok(true, 'solution passes all checks')
  await page.waitForSelector('.celebrate', { timeout: 5000 })
  const xpText = await page.locator('.celebrate-xp').innerText()
  ok(xpText === '+14 XP', `3 hints cost 45% of 25 XP -> ${xpText}`)
  await sleep(900)
  await shot('03-celebration')
  await page.locator('.celebrate-actions .btn.ghost').click()

  console.log('Persistence across reload')
  await page.reload()
  await page.waitForSelector('.cm-editor')
  ok(await page.locator('.done-chip').count() === 1, 'lesson still marked completed after reload')
  await go('#/')
  await page.waitForSelector('.star.done')
  ok((await page.locator('.star.done').count()) === 1, 'map shows 1 lit star after reload')
  ok((await page.locator('.difficulty-step[aria-current="step"]').innerText()).includes('Practice'), 'completing Guided advances the difficulty path to Practice')

  console.log('Predict lesson')
  await go('#/lesson/np-views')
  await page.waitForSelector('.choice')
  ok((await page.locator('.difficulty-step[aria-current="step"]').innerText()).includes('Challenge'), 'third lesson is marked Challenge')
  await page.locator('.choice').nth(0).click()
  ok(await page.locator('.choice.wrong').count() === 1, 'wrong guess is marked')
  await page.locator('.choice').nth(1).click()
  await page.waitForSelector('.choice.right')
  await page.waitForSelector('.out-console', { timeout: 30000 })
  ok((await page.locator('.out-console pre').first().innerText()).includes('99'), 'real output revealed after correct answer')
  await page.waitForSelector('.celebrate')
  await page.keyboard.press('Escape')

  console.log('Vim mode')
  await go('#/lesson/np-shapes')
  await page.waitForSelector('.cm-editor')
  await page.locator('.pill', { hasText: 'Vim' }).click()
  await page.waitForSelector('.cm-vim-panel', { timeout: 5000 })
  ok(true, 'Vim status panel appears when enabled')
  await page.locator('.workbench .cm-content').click()
  await page.keyboard.press('Escape')
  await page.keyboard.type('gg')
  await page.keyboard.type('dd')
  const firstLine = await page.locator('.workbench .cm-line').first().innerText()
  ok(!firstLine.includes('import numpy'), `vim "dd" deleted the first line (now: "${firstLine}")`)
  await page.keyboard.type('u')
  ok((await page.locator('.workbench .cm-line').first().innerText()).includes('import numpy'), 'vim "u" undid it')
  await page.keyboard.type(':w')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.out-verdict', { timeout: 30000 })
  ok(true, 'vim ":w" ran the code')
  await shot('04-vim')
  await page.locator('.pill', { hasText: 'Vim' }).click()
  ok(await page.locator('.workbench .cm-vim-panel').count() === 0, 'Vim mode can be switched off')

  console.log('Visual labs')
  await go('#/lesson/np-broadcast')
  await page.waitForSelector('.cm-editor')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.bc-grids', { timeout: 30000 })
  ok(true, 'Broadcast Lab renders')
  await shot('05-broadcast-lab')

  await go('#/lesson/lg-first')
  await page.waitForSelector('.cm-editor')
  await revealSolutionAndRun()
  await page.waitForSelector('.gt-svg', { timeout: 30000 })
  ok(await page.locator('.gt-node').count() === 4, 'Graph Lab draws START, 2 nodes, END')
  await page.locator('.gt-controls .btn', { hasText: /Replay|Play/ }).click()
  await sleep(2300)
  ok(await page.locator('.gt-node.visited').count() >= 2, 'Graph Lab playback visits nodes')
  await dismissCelebration()
  await shot('06-graph-lab')

  await go('#/lesson/ml-track')
  await page.waitForSelector('.cm-editor')
  await revealSolutionAndRun()
  await page.waitForSelector('.ml-table', { timeout: 30000 })
  ok(await page.locator('.ml-table tbody tr').count() === 3, 'MLflow Lab shows 3 runs')
  await dismissCelebration()
  await shot('07-mlflow-lab')

  await go('#/')
  await page.waitForSelector('.star.done')
  await sleep(700)
  await shot('11-map-progress')

  console.log('Parsons puzzle')
  await go('#/lesson/pd-pipeline')
  await page.waitForSelector('.parsons li')
  ok(await page.locator('.parsons li').count() === 7, '7 puzzle lines')
  await shot('08-parsons')

  console.log('Review, stats, palette, settings')
  await go('#/review')
  await page.waitForSelector('.flashcard')
  await page.locator('.flashcard').click()
  await page.waitForSelector('.grades')
  await page.locator('.grade-2').click()
  ok(true, 'flashcard flips and can be graded')
  await go('#/stats')
  await page.waitForSelector('.radar')
  ok(await page.locator('.achv.got').count() >= 2, 'achievements unlocked and shown')
  await shot('09-stats')
  await page.keyboard.press('Meta+k')
  await page.waitForSelector('.palette input')
  await page.keyboard.type('cosine')
  await page.keyboard.press('Enter')
  await sleep(400)
  ok(page.url().includes('np-cosine'), 'command palette jumps to a lesson')
  ok((await page.locator('.difficulty-step[aria-current="step"]').innerText()).includes('Boss'), 'last lesson is marked Boss')
  for (const [i, stage, id] of [[3, 'Applied', 'np-impute'], [4, 'Advanced', 'np-standardize'], [5, 'Production', 'np-softmax'], [6, 'Expert', 'np-pairwise']]) {
    await page.locator('.difficulty-step').nth(i).click()
    await page.waitForFunction((s) => document.querySelector('.difficulty-step[aria-current="step"]')?.textContent.includes(s), stage)
    ok(page.url().includes(`#/lesson/${id}`), `${stage} exercise (${id}) opens from the difficulty path`)
  }
  await page.locator('.difficulty-step').nth(7).click()
  await page.waitForFunction(() => document.querySelector('.difficulty-step[aria-current="step"]')?.textContent.includes('Boss'))
  await page.locator('button[aria-label="Settings"]').click()
  await page.waitForSelector('.modal')
  await page.locator('.switch[aria-checked]').nth(1).click()
  ok((await page.evaluate(() => document.documentElement.dataset.theme)) === 'light', 'light theme toggles')
  await page.locator('.switch[aria-checked]').nth(2).click()
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduced')
  await sleep(100)
  ok(await backdropFrames() === 0, 'Settings reduced motion stops the background animation')
  await page.locator('.switch[aria-checked]').nth(2).click()
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'full')
  await sleep(900)
  await shot('10-light-settings')
  await page.keyboard.press('Escape')

  console.log('Timeout protection')
  await go('#/lesson/np-shapes')
  await page.waitForSelector('.cm-editor')
  await page.locator('.workbench .cm-content').click()
  await page.keyboard.press('Meta+a')
  await page.keyboard.type('while True:\n    pass')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.out-infra', { timeout: 40000 })
  ok((await page.locator('.out-infra').innerText()).includes('stopped it'), 'infinite loop is stopped after 20s with a clear message')
  await page.locator('.toolbar .btn', { hasText: 'Reset' }).click()
  await page.locator('.toolbar .btn', { hasText: 'Really reset?' }).click()
  ok((await page.locator('.workbench .cm-content').innerText()).includes('np.arange(12)'), 'Reset restores the starter code')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.out-verdict', { timeout: 90000 })
  ok(true, 'runtime recovers after the restart and runs normal code')

  console.log('Mobile difficulty path')
  await page.setViewportSize({ width: 390, height: 844 })
  await go('#/')
  const mobilePath = await page.locator('.difficulty').boundingBox()
  ok(mobilePath && mobilePath.x >= 0 && mobilePath.x + mobilePath.width <= 390, 'difficulty path fits on mobile')
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile layout has no horizontal overflow')
  await shot('12-mobile')
} catch (e) {
  console.log('  ✗ FAIL (exception)', e.message)
  await shot('99-failure').catch(() => {})
  failures++
}

const real = errors.filter((e) => !/favicon/.test(e))
ok(real.length === 0, `no console errors or page errors${real.length ? ': ' + real.slice(0, 3).join(' | ') : ''}`)
await browser.close()
server.kill()
console.log(failures ? `\n${failures} FAILED` : '\nAll e2e checks passed')
process.exit(failures ? 1 : 0)
