// Vendors the AI Engineering from Scratch curriculum (MIT, github.com/rohitg00/ai-engineering-from-scratch)
// into the dashboard: lesson text, main.py, quiz and figures go to public/curriculum/<phase>/<lesson>/
// (fetched lazily by the Course pages) and a small index goes to src/content/course/index.json.
// Usage: node scripts/sync-curriculum.mjs   (source: $CURRICULUM_DIR or ~/ai-engineering-from-scratch)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { PYODIDE_STDLIB as STDLIB, imports } from './pyimports.mjs'

const SRC = resolve(process.env.CURRICULUM_DIR || join(homedir(), 'ai-engineering-from-scratch'))
const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, 'public', 'curriculum')
const INDEX = join(ROOT, 'src', 'content', 'course', 'index.json')
if (!existsSync(join(SRC, 'phases'))) throw new Error(`no phases/ directory in ${SRC}`)

const AVAILABLE = { numpy: null, pandas: null, scipy: 'scipy', sklearn: 'scikit-learn', matplotlib: 'matplotlib', langgraph: null, langchain_core: null, mlflow: null, pyspark: null, delta: null }

const minutesOf = (s) => {
  const m = /(\d+)\s*(hour|min)/.exec(s || '')
  return m ? Number(m[1]) * (m[2] === 'hour' ? 60 : 1) : 60
}
const field = (md, name) => (new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+)$`, 'm').exec(md)?.[1] ?? '').trim()

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
cpSync(join(SRC, 'LICENSE'), join(OUT, 'LICENSE'))

// estimated hours per phase from ROADMAP.md headings: `## Phase 3: Deep Learning Core — ✅ (~15 hours)`
const HOURS = Object.fromEntries([...readFileSync(join(SRC, 'ROADMAP.md'), 'utf8').matchAll(/^## Phase (\d+):.*\(~(\d+) hours\)/gm)].map((m) => [Number(m[1]), Number(m[2])]))

const phases = []
for (const phaseDir of readdirSync(join(SRC, 'phases')).filter((d) => /^\d\d-/.test(d)).sort()) {
  const readme = readFileSync(join(SRC, 'phases', phaseDir, 'README.md'), 'utf8').split('\n')
  const head = /^# Phase (\d+):\s*(.+)$/.exec(readme[0])
  const phase = { dir: phaseDir, n: Number(head?.[1] ?? phaseDir.slice(0, 2)), title: (head?.[2] ?? phaseDir.slice(3)).trim(), blurb: (readme.find((l) => l.startsWith('> ')) ?? '').slice(2).trim(), hours: HOURS[Number(head?.[1] ?? phaseDir.slice(0, 2))] ?? 0, lessons: [] }
  for (const lessonDir of readdirSync(join(SRC, 'phases', phaseDir)).filter((d) => /^\d\d-/.test(d)).sort()) {
    const dir = join(SRC, 'phases', phaseDir, lessonDir)
    const mdPath = join(dir, 'docs', 'en.md')
    if (!existsSync(mdPath)) continue
    const md = readFileSync(mdPath, 'utf8')
    const outDir = join(OUT, phaseDir, lessonDir)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'en.md'), md)

    const lesson = {
      dir: lessonDir,
      n: Number(lessonDir.slice(0, 2)),
      title: (/^# (.+)$/m.exec(md)?.[1] ?? lessonDir.slice(3)).trim(),
      tagline: (md.split('\n').slice(0, 8).find((l) => l.startsWith('> ')) ?? '').slice(2).trim(),
      type: field(md, 'Type') || 'Learn',
      langs: field(md, 'Languages').replace(/^—$/, ''),
      minutes: minutesOf(field(md, 'Time')),
      code: false,
      needs: [],
      packages: [],
      quiz: 0,
    }

    // the lesson script: main.py, or the single non-test .py file in code/
    const scripts = existsSync(join(dir, 'code')) ? readdirSync(join(dir, 'code')).filter((f) => f.endsWith('.py') && !/^(test|tests|verify)/.test(f) && !f.endsWith('_test.py')) : []
    const script = scripts.includes('main.py') ? 'main.py' : scripts.length === 1 ? scripts[0] : null
    if (script) {
      const py = readFileSync(join(dir, 'code', script), 'utf8')
      writeFileSync(join(outDir, 'main.py'), py)
      lesson.code = true
      for (const mod of imports(py)) {
        if (mod in AVAILABLE) { if (AVAILABLE[mod]) lesson.packages.push(AVAILABLE[mod]) }
        else if (!STDLIB.has(mod)) lesson.needs.push(mod)
      }
      lesson.needs.sort()
      lesson.packages = [...new Set(lesson.packages)]
    }

    const quizPath = join(dir, 'quiz.json')
    if (existsSync(quizPath)) {
      const raw = JSON.parse(readFileSync(quizPath, 'utf8'))
      const items = (Array.isArray(raw) ? raw : raw.questions ?? []).filter(
        (q) => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length,
      )
      const order = { pre: 0, check: 1, post: 2 }
      const quiz = items
        .map((q) => ({ stage: q.stage in order ? q.stage : 'post', question: q.question, options: q.options.map(String), correct: q.correct, explanation: typeof q.explanation === 'string' ? q.explanation : '' }))
        .sort((a, b) => order[a.stage] - order[b.stage])
      if (quiz.length) {
        writeFileSync(join(outDir, 'quiz.json'), JSON.stringify(quiz))
        lesson.quiz = quiz.length
      }
    }

    if (existsSync(join(dir, 'assets'))) cpSync(join(dir, 'assets'), join(outDir, 'assets'), { recursive: true })
    phase.lessons.push(lesson)
  }
  phases.push(phase)
}

const known = new Set(phases.flatMap((p) => p.lessons.map((l) => `${p.dir}/${l.dir}`)))
const paths = []
for (const file of readdirSync(join(SRC, 'learning-paths')).filter((f) => f.endsWith('.json')).sort()) {
  const p = JSON.parse(readFileSync(join(SRC, 'learning-paths', file), 'utf8'))
  const lessons = (p.lessons ?? []).map((l) => String(l.path ?? '').replace(/^phases\//, '')).filter((l) => known.has(l))
  if (p.id && p.title && lessons.length) paths.push({ id: p.id, title: p.title, summary: p.summary ?? '', minutes: Number(p.estimatedMinutes) || 0, lessons })
}

mkdirSync(join(ROOT, 'src', 'content', 'course'), { recursive: true })
writeFileSync(INDEX, JSON.stringify({ source: 'https://github.com/rohitg00/ai-engineering-from-scratch', syncedAt: new Date().toISOString().slice(0, 10), phases, paths }, null, 1))
const all = phases.flatMap((p) => p.lessons)
console.log(`${phases.length} phases, ${all.length} lessons, ${all.filter((l) => l.code).length} with code (${all.filter((l) => l.code && !l.needs.length).length} runnable in the browser), ${all.filter((l) => l.quiz).length} with quizzes, ${paths.length} learning paths → ${OUT}`)
