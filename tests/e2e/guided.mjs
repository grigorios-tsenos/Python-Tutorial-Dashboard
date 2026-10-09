// Production-browser coverage for guided checks, retries, persistence and mode switching.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const port = 4182
const url = `http://localhost:${port}`
const shots = process.env.SHOTS_DIR || '/tmp/orbit-guided-shots'
mkdirSync(shots, { recursive: true })
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(url)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const open = async id => {
    await page.goto(`${url}/#/lesson/${id}`)
    await page.waitForSelector('.practice-modes')
  }
  const edit = async text => {
    await page.locator('.guided-editor .cm-content').click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText(text)
  }
  const check = async () => {
    await page.locator('.guided-check').click()
    await page.waitForSelector('.guided-feedback.pass', { timeout: 120000 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 1000, 'editor tooltip container does not add document overflow')
  }
  const ownAttempts = [
    'import numpy as np',
    'scores = np.asarray(raw)',
    'boosted = np.add(scores, 0.05)',
    'print(np.average(boosted))',
  ]
  const attempt = async () => ownAttempts[Number(/step (\d+) of/.exec(await page.locator('.guided-progress').innerText())[1]) - 1]
  const next = page.getByRole('button', { name: 'Next step →', exact: true })
  await open('np-first-array')
  await page.locator('.workbench').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)))
  await page.screenshot({ path: `${shots}/00-start.png` })
  assert.equal(await page.getByRole('button', { name: 'Line by line', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await next.isDisabled(), true, 'cannot advance before checking')
  assert.equal(await page.locator('.guided-task pre').count(), 0, 'the goal does not display a solution snippet')
  assert.doesNotMatch(await page.locator('.guided-task').innerText(), /import numpy as np/)
  await edit('scores = []')
  await page.locator('.guided-check').click()
  await page.waitForSelector('.out-error, .out-verdict.fail', { timeout: 120000 })
  assert.equal(await next.isDisabled(), true, 'incorrect code cannot advance')
  assert.match(await page.locator('.guided-feedback').innerText(), /earlier work is saved/)
  await edit(await attempt())
  await check()
  assert.equal(await page.locator('.done-chip').count(), 0, 'an early check does not complete the lesson')
  await page.locator('.icon-btn[aria-label="Settings"]').click()
  await page.locator('input[type="file"]').setInputFiles({ name: 'guided-import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'orbit', data: { guided: { 'np-first-array': { step: 1, drafts: ['# imported previous line', '# unchecked current line'] } } } })) })
  await page.getByText('Progress imported.', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await next.isDisabled(), true, 'imported drafts cannot reuse the previous step verdict')
  assert.equal(await page.locator('.guided-feedback.pass').count(), 0, 'import clears stale reassurance')
  await page.locator('.icon-btn[aria-label="Settings"]').click()
  await page.getByRole('textbox', { name: 'Type reset to confirm' }).fill('reset')
  await page.getByRole('button', { name: 'Erase all progress', exact: true }).click()
  await page.keyboard.press('Escape')
  assert.equal(await next.isDisabled(), true, 'reset clears the previous verdict')
  await edit(await attempt())
  await check()
  await edit('# changed after checking')
  assert.equal(await next.isDisabled(), true, 'editing invalidates the previous check')
  await edit(await attempt())
  await check()
  await next.click()
  assert.match(await page.locator('h2:focus').innerText(), /Step 2:/, 'advancing announces the new step heading')
  assert.match(await page.locator('.guided-editor .cm-content').getAttribute('aria-label'), /Write step 2:/, 'editor is named for the current task')
  assert.match(await page.locator('.guided-task').innerText(), /scores/)
  assert.match(await page.locator('.guided-task').innerText(), /raw/)
  const secondSnippet = await attempt()
  await edit(secondSnippet)
  await page.locator('.guided-editor .cm-line span', { hasText: /^asarray$/ }).hover()
  await page.waitForSelector('.cm-doc-tip', { timeout: 60000 })
  assert.match(await page.locator('.cm-doc-tip .sig').innerText(), /^numpy\.asarray\(/, 'guided hover sees imports from earlier steps before the current step runs')
  await page.mouse.move(5, 5)
  await check()
  await next.click()
  await page.getByRole('button', { name: '← Previous step', exact: true }).click()
  assert.equal(await page.locator('.guided-editor .cm-content').innerText(), secondSnippet, 'back preserves the typed draft')
  assert.equal(await next.isDisabled(), true, 'revisited steps require verification')
  await check()
  await next.click()
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
      return stored && JSON.parse(stored).state.guided['np-first-array']?.step === 2
    } finally { db.close() }
  })
  await page.reload()
  await page.waitForSelector('.guided-task')
  assert.match(await page.locator('.guided-progress').innerText(), /step 3 of/)
  assert.equal(await next.isDisabled(), true, 'reload does not claim an unchecked draft passed')
  for (let count = 0; count < 30; count++) {
    await edit(await attempt())
    await check()
    if (await page.locator('.done-chip').count()) break
    assert.equal(await next.isEnabled(), true)
    await next.click()
  }
  assert.equal(await page.locator('.done-chip').count(), 1, 'final full checks complete the lesson')
  await page.waitForSelector('.celebrate')
  await page.keyboard.press('Escape')
  await page.screenshot({ path: `${shots}/01-verified.png` })
  assert.equal(await page.evaluate(() => scrollY), 0, 'desktop navigation keeps the page chrome in view')

  await open('np-shapes')
  await page.getByRole('button', { name: 'Full exercise', exact: true }).click()
  await page.locator('.workbench .cm-content').click()
  await page.keyboard.press('Meta+a')
  await page.keyboard.insertText('# my independent practice')
  await page.getByRole('button', { name: 'Line by line', exact: true }).click()
  await edit('import numpy as np')
  await page.getByRole('button', { name: 'Full exercise', exact: true }).click()
  assert.equal(await page.locator('.workbench .cm-content').innerText(), '# my independent practice', 'guided drafts preserve full exercise code')
  await page.locator('.pill', { hasText: 'Vim' }).click()
  await page.getByRole('button', { name: 'Line by line', exact: true }).click()
  await page.locator('.guided-task h2').focus()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.guided-editor .cm-content').evaluate(element => element === document.activeElement), true, 'Escape focuses the guided editor')
  await page.locator('.guided-editor .cm-fat-cursor').waitFor({ state: 'visible' })

  await page.keyboard.press('i')
  assert.match(await page.locator('.cm-vim-panel').innerText(), /INSERT/, 'i enters insert mode after focusing')
  await page.keyboard.press('Escape')
  assert.match(await page.locator('.cm-vim-panel').innerText(), /NORMAL/, 'Escape returns to normal mode without leaving the editor')
  await page.locator('.guided-task h2').focus()
  await page.keyboard.press('i')
  assert.equal(await page.locator('.guided-editor .cm-content').evaluate(element => element === document.activeElement), true, 'i focuses the guided editor from the page')
  await page.keyboard.press('Escape')
  await page.keyboard.type(':w')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.guided-feedback.pass', { timeout: 30000 })
  assert.equal(await page.locator('.guided-editor .cm-content').evaluate(element => element === document.activeElement), true, 'checking keeps keyboard focus in the guided editor')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.guided-editor .cm-content').evaluate(element => element === document.activeElement), true, 'Escape restores focus after checking')
  await page.locator('.guided-editor .cm-fat-cursor').waitFor({ state: 'visible' })

  await page.keyboard.press('i')
  await edit('import numpy as np\nimport time\ntime.sleep(0.75)')
  const editorBeforeCheck = await page.locator('.guided-editor .cm-editor').elementHandle()
  await page.keyboard.press('Meta+Enter')
  await page.waitForFunction(() => document.querySelector('.guided-check')?.disabled)
  assert.equal(await page.locator('.guided-editor .cm-content').getAttribute('contenteditable'), 'true', 'checking leaves the editor available like Full exercise')
  await page.keyboard.insertText('\n# changed while checking')
  await page.waitForFunction(() => !document.querySelector('.guided-check')?.disabled)
  assert.equal(await editorBeforeCheck.evaluate(element => element.isConnected), true, 'checking preserves the editor instance and cursor state')
  assert.match(await page.locator('.cm-vim-panel').innerText(), /INSERT/, 'checking preserves Vim insert mode')
  assert.equal(await page.locator('.guided-feedback.pass').count(), 0, 'edits during checking cannot earn a stale passing verdict')
  assert.equal(await next.isDisabled(), true, 'changed code needs a fresh check')

  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.guided-task h2').focus()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => {
    const rect = document.querySelector('.guided-editor .cm-fat-cursor')?.getBoundingClientRect()
    return rect && rect.top >= 0 && rect.bottom <= innerHeight
  }, undefined, { timeout: 5000 })
  assert.equal(await page.locator('.guided-editor .cm-content').evaluate(element => element === document.activeElement), true, 'Escape brings an offscreen guided cursor into view')
  await page.setViewportSize({ width: 1440, height: 1000 })

  await open('np-views')
  assert.equal(await page.locator('.choice').count(), 0, 'trace before choosing')
  while (await page.getByRole('button', { name: 'Next line →', exact: true }).count()) await page.getByRole('button', { name: 'Next line →', exact: true }).click()
  await page.waitForSelector('.choice')
  await page.locator('.choice').nth(0).click()
  assert.match(await page.locator('.choices').innerText(), /try another option/)
  await page.locator('.choice').nth(1).click()
  await page.waitForSelector('.out-console', { timeout: 30000 })
  assert.match(await page.locator('.out-console').innerText(), /99/)
  await page.waitForSelector('.celebrate')
  await page.keyboard.press('Escape')

  const lessons = readdirSync('src/content/lessons').flatMap(track => readdirSync(`src/content/lessons/${track}`).map(file => /^id: (.+)$/m.exec(readFileSync(`src/content/lessons/${track}/${file}`, 'utf8'))[1]))
  await page.setViewportSize({ width: 390, height: 844 })
  for (const id of lessons) {
    await open(id)
    assert.equal(await page.locator('.guided-task, .prediction-guide').count(), 1, `${id}: has a guided path`)
    assert.equal(await page.locator('.guided-task pre').count(), 0, `${id}: coding goals do not expose the reference code`)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: fits mobile width`)
  }
  await open('cc-permissions')
  await page.locator('.workbench').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)))
  await page.screenshot({ path: `${shots}/02-mobile.png`, fullPage: true })
  assert.deepEqual(errors, [], 'no browser errors')
  console.log('✓ Guided keyboard focus, Vim, editing during checks, hover context, retries, persistence, grading and all 108 mobile layouts')
} finally {
  await browser?.close()
  server.kill()
}
