import type { Flashcard, Lesson, LessonKind, TrackId } from './types'

const KINDS: LessonKind[] = ['run', 'lab', 'predict', 'bug', 'parsons', 'build', 'boss']

interface Section {
  name: string
  text: string
}

/** Parse one lesson file: `key: value` frontmatter between --- lines, then `@@name` sections. */
export function parseLesson(src: string, file = 'lesson'): Lesson {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  if (lines[0].trim() !== '---') throw new Error(`${file}: missing frontmatter`)
  const end = lines.indexOf('---', 1)
  if (end < 0) throw new Error(`${file}: unterminated frontmatter`)
  const fm: Record<string, string> = {}
  for (const l of lines.slice(1, end)) {
    if (!l.trim()) continue
    const i = l.indexOf(':')
    if (i < 0) throw new Error(`${file}: bad frontmatter line "${l}"`)
    fm[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  const sections: Section[] = []
  let cur: { name: string; buf: string[] } | null = null
  for (const l of lines.slice(end + 1)) {
    const m = /^@@(\w+)\s*$/.exec(l)
    if (m) {
      if (cur) sections.push({ name: cur.name, text: trim(cur.buf) })
      cur = { name: m[1], buf: [] }
    } else if (cur) cur.buf.push(l)
  }
  if (cur) sections.push({ name: cur.name, text: trim(cur.buf) })

  const one = (n: string) => sections.find((s) => s.name === n)?.text ?? ''
  const many = (n: string) => sections.filter((s) => s.name === n).map((s) => s.text)
  const kind = fm.kind as LessonKind
  if (!KINDS.includes(kind)) throw new Error(`${file}: bad kind "${fm.kind}"`)

  const qs = many('q')
  const as = many('a')
  if (qs.length !== as.length) throw new Error(`${file}: @@q / @@a count mismatch`)
  const cards: Flashcard[] = qs.map((q, i) => ({ q, a: as[i] }))

  // parsons lines keep their indentation; blank lines are dropped
  const rawLines = sections.find((s) => s.name === 'lines')
  const parsonsLines = rawLines ? rawLines.text.split('\n').filter((l) => l.trim() !== '') : []

  return {
    id: fm.id,
    track: fm.track as TrackId,
    order: Number(fm.order),
    title: fm.title,
    tagline: fm.tagline,
    kind,
    xp: Number(fm.xp),
    minutes: Number(fm.minutes),
    packages: fm.packages ? fm.packages.split(',').map((s) => s.trim()) : [],
    body: one('body'),
    starter: one('starter'),
    solution: one('solution'),
    check: one('check'),
    hints: many('hint'),
    choices: many('choice'),
    answer: fm.answer !== undefined ? Number(fm.answer) : -1,
    explain: one('explain'),
    lines: parsonsLines,
    cards,
    real: one('real'),
  }
}

function trim(buf: string[]): string {
  let a = 0
  let b = buf.length
  while (a < b && buf[a].trim() === '') a++
  while (b > a && buf[b - 1].trim() === '') b--
  return buf.slice(a, b).join('\n')
}

export function validateLesson(l: Lesson): string[] {
  const errs: string[] = []
  const need = (ok: boolean, msg: string) => ok || errs.push(`${l.id}: ${msg}`)
  need(!!l.id && /^[a-z0-9-]+$/.test(l.id), 'id must be kebab-case')
  need(!!l.title && !!l.tagline, 'title and tagline required')
  need(l.xp > 0 && l.minutes > 0, 'xp and minutes must be positive')
  need(!!l.body, 'body required')
  need(l.hints.length === 2, 'exactly 2 hints required')
  need(l.cards.length >= 1, 'at least 1 flashcard required')
  if (l.kind === 'predict') {
    need(l.choices.length >= 3, 'predict needs >= 3 choices')
    need(l.answer >= 0 && l.answer < l.choices.length, 'predict needs a valid answer index')
    need(!!l.explain, 'predict needs @@explain')
    need(!!l.starter, 'predict needs the code in @@starter')
  } else if (l.kind === 'parsons') {
    need(l.lines.length >= 4, 'parsons needs >= 4 lines')
    need(!!l.check, 'parsons needs a @@check')
  } else {
    need(!!l.starter, 'starter required')
    need(!!l.solution, 'solution required')
  }
  if (l.kind === 'build' || l.kind === 'bug' || l.kind === 'boss') need(!!l.check, 'graded kinds need a @@check')
  return errs
}
