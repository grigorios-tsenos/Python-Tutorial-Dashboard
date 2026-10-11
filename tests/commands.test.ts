import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../src/content'
import { BASELINE, CARD_BY_KEY, COMMAND_CARDS, USAGE, commandsFor } from '../src/content/commands'
import { CODING_GUIDES } from '../src/content/guided'
import { getPy } from './pyodide-node'

interface Traced { steps: string[][]; lines: Record<string, string[]>[]; unresolved: string[]; error: string | null }

async function trace(): Promise<Record<string, Traced>> {
  const py = await getPy()
  py.FS.writeFile('/orbit_site/command_usage.py', readFileSync('scripts/command_usage.py', 'utf8'))
  py.runPython('import sys; sys.modules.pop("command_usage", None); import command_usage')
  const mod = py.globals.get('command_usage')
  const out: Record<string, Traced> = {}
  const loaded = new Set<string>()
  for (const lesson of LESSONS) {
    const need = lesson.packages.filter(p => !loaded.has(p))
    if (need.length) await py.loadPackage(need)
    need.forEach(p => loaded.add(p))
    const guide = CODING_GUIDES[lesson.id]
    const raw = guide
      ? await mod.usage(guide.setup ?? '', py.toPy(guide.steps.map(s => s.code)), py.toPy(guide.steps.map(s => s.check)), lesson.check)
      : await mod.usage('', py.toPy([lesson.starter]), py.toPy(['']), '')
    out[lesson.id] = JSON.parse(raw)
  }
  return out
}

/** Prediction lessons are read one non-empty line at a time (PredictionGuide), so their units are those lines. */
function units(lessonId: string, traced: Traced): string[][] {
  if (CODING_GUIDES[lessonId]) return traced.steps
  const lesson = LESSONS.find(l => l.id === lessonId)!
  const numbered = lesson.starter.split('\n').map((text, i) => ({ text, line: i + 1 })).filter(l => l.text.trim())
  return numbered.map(({ line }) => traced.lines[0][line] ?? [])
}

describe('commands each lesson uses', () => {
  it('traces every lesson and matches the committed usage map', async () => {
    const traced = await trace()
    for (const [id, t] of Object.entries(traced)) {
      expect(t.error, id).toBeNull()
      expect(t.unresolved, id).toEqual([])
    }
    const map = Object.fromEntries(Object.entries(traced).map(([id, t]) => [id, units(id, t)]))
    const json = `{\n${Object.entries(map).map(([id, u]) => ` ${JSON.stringify(id)}: ${JSON.stringify(u)}`).join(',\n')}\n}\n`
    await expect(json).toMatchFileSnapshot('../src/content/commands/usage.json')
  }, 300_000)

  it('has exactly one card for every command a lesson uses beyond the baseline', () => {
    const used = new Set(Object.values(USAGE).flat(2).filter(key => !BASELINE.has(key)))
    expect([...used].filter(key => !CARD_BY_KEY[key]).sort()).toEqual([])
    const keys = COMMAND_CARDS.flatMap(card => card.keys)
    expect(keys.filter((key, i) => keys.indexOf(key) !== i), 'a key belongs to one card').toEqual([])
    expect(keys.filter(key => !used.has(key)).sort(), 'cards for commands no lesson uses').toEqual([])
  })

  it('writes complete cards', () => {
    for (const card of COMMAND_CARDS) {
      for (const value of [card.name, card.signature, card.summary]) expect(value.trim(), card.name).not.toBe('')
      if (card.kind !== 'constant' && card.kind !== 'attribute') expect(card.returns.trim(), card.name).not.toBe('')
      for (const param of card.params) expect(param.text.trim(), `${card.name} ${param.name}`).not.toBe('')
      for (const text of [card.summary, card.returns, ...card.params.map(p => p.text)]) expect(text, card.name).not.toContain('```')
    }
  })

  it('shows each card once as new, at its first use in learning order', () => {
    const fresh = LESSONS.flatMap(lesson => (USAGE[lesson.id] ?? []).flatMap((_, unit) => commandsFor(lesson.id, unit).fresh))
    expect(new Set(fresh).size).toBe(fresh.length)
    expect(fresh.length).toBe(new Set(Object.values(USAGE).flat(2).filter(key => !BASELINE.has(key)).map(key => CARD_BY_KEY[key])).size)
  })

  it('never gives away a step: no card repeats a call or line from the reference code', () => {
    for (const lesson of LESSONS) {
      const guide = CODING_GUIDES[lesson.id]
      const sources = guide ? guide.steps.map(s => s.code) : [lesson.starter]
      for (const [unit, keys] of (USAGE[lesson.id] ?? []).entries()) {
        const code = guide ? sources[unit] : sources[0]
        const pieces = [
          ...code.split('\n').map(line => line.trim()).filter(line => line.length > 12),
          ...[...code.matchAll(/[\w.]+\([^()\n]+\)/g)].map(m => m[0]),
        ]
        for (const key of keys) {
          const card = CARD_BY_KEY[key]
          if (!card) continue
          const text = [card.signature, card.summary, card.returns, ...card.params.map(p => p.text)].join('\n')
          for (const piece of pieces) expect(text.includes(piece), `${lesson.id} unit ${unit + 1}: card ${card.name} contains “${piece}”`).toBe(false)
        }
      }
    }
  })
})
