// End-to-end check of the Course pages (AI Engineering from Scratch) in a real Chromium with real Pyodide.
// Usage: npm run build && node tests/e2e/course.mjs   (starts `vite preview` itself; mermaid comes from jsDelivr)
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const SHOTS = process.env.SHOTS_DIR || '/tmp/orbit-shots'
const EXEC = process.env.BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
const PORT = 4174
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
const index = JSON.parse(readFileSync('src/content/course/index.json', 'utf8'))
const LESSON = '02-ml-fundamentals/02-linear-regression' // code (scikit-learn), mermaid diagrams and a 5-question quiz
const quiz = JSON.parse(readFileSync(`public/curriculum/${LESSON}/quiz.json`, 'utf8'))

const browser = await chromium.launch({ executablePath: EXEC, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()} @ ${page.url().replace(/^.*#/, '#')}`))
// leaving a lesson while mermaid is still drawing logs an SVG error for the detached diagram, so let it finish first
const settle = () => page.waitForFunction(() => [...document.querySelectorAll('pre.mermaid')].every((n) => n.querySelector('svg')), null, { timeout: 15000 }).catch(() => {})
const go = async (hash) => { await settle(); await page.evaluate((h) => (location.hash = h), hash); await sleep(300) }
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png` })

try {
  console.log('Course index')
  await page.goto(URL)
  await page.waitForSelector('.map-hero')
  await page.locator('.hero-course').click()
  await page.waitForSelector('.phase-rail')
  ok((await page.locator('.phase-link').count()) === 20, '20 phases in the rail')
  ok((await page.locator('.course-row').count()) === index.phases[0].lessons.length, 'phase 0 lessons listed by default')
  ok((await page.locator('.course-progress .stat-num').innerText()).startsWith('0'), 'nothing done yet')
  await page.locator('.phase-link').nth(14).click()
  await sleep(200)
  ok((await page.locator('.course-lessons h2').innerText()) === 'Agent Engineering', 'phase rail switches the lesson list')
  await shot('c1-course')
  await page.locator('.course-paths .pill', { hasText: 'Model Context Protocol' }).click()
  await sleep(200)
  ok((await page.locator('.course-row').count()) === 17, 'learning path lists its 17 lessons across phases')

  console.log('Lesson: article, diagram, script, quiz')
  await go(`#/course/${LESSON}`)
  await page.waitForSelector('.course-article h2')
  ok((await page.locator('.lesson-pane h1').innerText()) === 'Linear Regression', 'title from the index')
  ok((await page.locator('.course-prereq').innerText()).includes('Prerequisites'), 'prerequisites line shown')
  ok((await page.locator('.course-article h2').first().innerText()) === 'Learning Objectives', 'header metadata stripped from the article')
  await page.waitForSelector('pre.mermaid svg', { timeout: 40000 })
  ok(true, 'mermaid diagrams rendered from the CDN')
  ok(await page.locator('.workbench .cm-editor').count() === 1, 'script loaded into the editor')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.out-console', { timeout: 120000 })
  const out = await page.locator('.output').innerText()
  ok(/Generated 100 samples/.test(out), 'script ran in Pyodide with scikit-learn')
  ok((await page.locator('.out-error').count()) === 0, 'no Python error')
  await shot('c2-lesson')

  console.log('Lesson flow: predict → read → check → build → quiz (post questions graded)')
  const stage = (st) => quiz.filter((q) => q.stage === st)
  const post = stage('post').length ? stage('post') : quiz
  const answer = async (scope, qs) => {
    for (const q of qs) {
      await page.locator(`${scope} .quiz .choice`).nth(q.correct).click()
      await page.waitForSelector(`${scope} .quiz-explain.ok`)
      await page.locator(`${scope} .quiz-explain .btn`).click()
    }
  }
  ok((await page.locator('.flow button').count()) >= 4, 'lesson flow nav lists the stages')
  ok((await page.locator('.stage-check').count()) === (stage('check').length ? 1 : 0), 'check stage sits inside the article when the quiz has check questions')
  if (stage('pre').length) {
    await answer('.stage-pre', stage('pre'))
    ok((await page.locator('.stage-pre .quiz-summary').count()) === 1, 'pre-reading predictions finish without a pass mark')
  }
  if (stage('check').length) await answer('.stage-check', stage('check'))
  ok((await page.locator('.flow button.done').count()) >= 1, 'finished stages tick off in the flow nav')
  await page.locator('.quiz-card').scrollIntoViewIfNeeded()
  await answer('.quiz-card', post)
  await page.waitForSelector('.quiz-card .quiz-score')
  ok((await page.locator('.quiz-card .quiz-score').innerText()) === `${post.length} / ${post.length}`, 'post questions graded')
  await page.waitForSelector('.done-chip')
  ok((await page.locator('.done-chip').innerText()).includes(`Passed ${post.length}/${post.length}`), 'lesson marked passed')
  ok((await page.locator('.toast').first().innerText()).includes('+45 XP'), '90-minute lesson pays 45 XP')
  await shot('c3-quiz')

  console.log('Persistence and dashboard')
  await page.reload()
  await page.waitForSelector('.done-chip', { timeout: 15000 })
  ok(true, 'completion survives a reload')
  await go('#/course')
  await page.waitForSelector('.course-progress')
  ok((await page.locator('.course-progress .stat-num').innerText()).startsWith('1'), 'course progress counts the lesson')
  ok((await page.locator('.course-row.done').count()) === 1, 'the row shows as done')
  await go('#/stats')
  await page.waitForSelector('.kpi-grid')
  ok((await page.locator('.kpi-v', { hasText: '/ 523' }).innerText()) === '1 / 523', 'dashboard KPI shows course lessons')

  console.log('Warm-up recall on the next lesson')
  await go(`#/course/${LESSON}`)
  await page.waitForSelector('.lesson-nav')
  await settle()
  await page.locator('.lesson-nav a', { hasText: 'Next:' }).click()
  await page.waitForSelector('.stage-warmup .quiz', { timeout: 15000 })
  ok(/linear regression/i.test(await page.locator('.stage-warmup h2').innerText()), 'two questions from the previous lesson open the next one')

  console.log('Placement → plan → phase check')
  await go('#/course')
  await page.waitForSelector('.plan-cta')
  await page.locator('.plan-cta .btn').click()
  await page.waitForSelector('.placement .choice')
  for (const k of [0, 3, 1, 2, 0, 3, 2, 1, 0, 1]) { // the answer key of src/content/placement.ts
    await page.locator('.placement .choice').nth(k).click()
    await sleep(60)
  }
  await page.waitForSelector('.placement-areas')
  ok(/phase 14/i.test(await page.locator('.placement h2').innerText()), '10/10 places the learner at Phase 14')
  await page.locator('.placement .btn.primary').click()
  await page.waitForSelector('.phase-status')
  ok((await page.locator('.phase-link.skip').count()) === 14 && (await page.locator('.phase-link.do').count()) === 6, 'phases 0–13 skipped, 14–19 to do')
  await page.locator('.course-lessons > h2', { hasText: 'Agent Engineering' }).waitFor({ timeout: 5000 }).catch(() => {})
  ok((await page.locator('.course-lessons > h2').innerText()) === 'Agent Engineering', 'saving the plan opens the entry phase')
  ok((await page.locator('.course-progress .btn.primary').innerText()).includes('Continue'), 'continue button follows the plan')
  await shot('c5-plan')
  await page.locator('.phase-tools .btn', { hasText: 'Phase check' }).click()
  await page.waitForSelector('.phase-check .quiz .choice', { timeout: 15000 })
  ok((await page.locator('.phase-check .chip').innerText()).length > 0, 'phase check tags each question with its lesson')
  for (let i = 0; i < 8; i++) {
    await page.locator('.phase-check .quiz .choice').first().click()
    await page.waitForSelector('.phase-check .quiz-explain')
    await page.locator('.phase-check .quiz-explain .btn').click()
  }
  await page.waitForSelector('.phase-result')
  ok(/(Mastered|Almost|Developing|Start over)/.test(await page.locator('.phase-result .quiz-score').innerText()), 'phase check graded like check-understanding')
  await shot('c6-phase-check')

  console.log('Local run for a script the browser cannot run')
  const localLesson = index.phases.flatMap((p) => p.lessons.map((l) => ({ key: `${p.dir}/${l.dir}`, l }))).find(({ l }) => l.code && l.needs.length === 1 && l.needs[0] === 'threading')
  await go(`#/course/${localLesson.key}`)
  await page.waitForSelector('.course-needs')
  ok((await page.locator('.runtime').innerText()).includes('this machine'), 'toolbar says the script runs on this machine')
  await page.locator('.btn.run').click()
  await page.waitForSelector('.out-console', { timeout: 180000 })
  ok((await page.locator('.out-error').count()) === 0, `threading script ran locally through uv (${localLesson.key})`)
  await shot('c7-local-run')

  console.log('Reading lesson and mobile layout')
  const reading = index.phases.flatMap((p) => p.lessons.map((l) => ({ key: `${p.dir}/${l.dir}`, l }))).find(({ l }) => !l.code)
  await go(`#/course/${reading.key}`)
  await page.waitForSelector('.course-article')
  ok((await page.locator('.workbench').count()) === 0 && (await page.locator('.lesson.reading').count()) === 1, 'lesson without a script is a full-width article')
  await page.setViewportSize({ width: 390, height: 844 })
  await go('#/course')
  await page.waitForSelector('.phase-rail')
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'course page has no horizontal scroll on a phone')
  await go(`#/course/${LESSON}`)
  await page.waitForSelector('.course-article h2')
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'lesson page has no horizontal scroll on a phone')
  await shot('c4-mobile')

  const real = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/.test(e))
  ok(real.length === 0, `no page errors${real.length ? `: ${real.join(' | ')}` : ''}`)
} catch (e) {
  failures++
  console.log('  ✗ CRASH', e)
  await shot('cx-crash').catch(() => {})
} finally {
  await browser.close()
  server.kill()
}
console.log(failures ? `\n${failures} failure(s)` : '\nall course e2e checks passed')
process.exit(failures ? 1 : 0)
