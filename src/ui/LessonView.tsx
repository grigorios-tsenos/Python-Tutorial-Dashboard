import { useCallback, useEffect, useRef, useState } from 'react'
import { LESSON_BY_ID, lessonsOf, nextLessonId } from '../content'
import { LessonWalkthrough } from '../labs/LessonWalkthrough'
import { TRACK_BY_ID } from '../content/tracks'
import { KIND_LABEL, type Lesson } from '../content/types'
import { allPassed } from '../engine/outputText'
import { runner, useRunnerStatus } from '../engine/runner'
import type { RunResult } from '../engine/types'
import { debugMove } from '../lib/learning'
import { go, lessonPath } from '../lib/router'
import { seededShuffle } from '../lib/shuffle'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'
import { CodeEditor, setVimActions } from './CodeEditor'
import { Difficulty, STAGES } from './Difficulty'
import { Hints } from './Hints'
import { Markdown } from './Markdown'
import { OutputPanel } from './OutputPanel'
import { Parsons, restoreOrder } from './Parsons'

export function LessonView({ id }: { id: string }) {
  const lesson = LESSON_BY_ID[id]
  if (!lesson) {
    return (
      <div className="page center">
        <h1>That star isn't on the map</h1>
        <p className="dim">No lesson with id “{id}”.</p>
        <a className="btn primary" href="#/">Back to the map</a>
      </div>
    )
  }
  return <LessonInner key={id} lesson={lesson} />
}

function LessonInner({ lesson }: { lesson: Lesson }) {
  const { id } = lesson
  const track = TRACK_BY_ID[lesson.track]
  const done = useStore((s) => s.completed[id])
  const hintsUsed = useStore((s) => s.hints[id] ?? 0)
  const savedCode = useStore((s) => s.code[id])
  const vimOn = useStore((s) => s.settings.vim)
  const rigor = useStore((s) => s.settings.rigor)
  const tries = useStore((s) => s.tries[id] ?? 0)
  const note = useStore((s) => s.notes[id])
  const { setCode, recordRun, revealHint, completeLesson, missPredict, setSetting, setLastLesson, setNote, redoLesson } = useStore.getState()
  const runtime = useRunnerStatus()

  const isParsons = lesson.kind === 'parsons'
  const isPredict = lesson.kind === 'predict'
  const graded = !!lesson.check

  const [code, setCodeState] = useState(savedCode ?? lesson.starter)
  const [order, setOrder] = useState<string[]>(() => restoreOrder(savedCode, lesson.lines) ?? seededShuffle(lesson.lines, lesson.id))
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [solved, setSolved] = useState(!!done)
  const [resetArmed, setResetArmed] = useState(false)
  const attempts = useRef(0)
  const token = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; text: string; badges: string[] } | null>(null)

  useEffect(() => {
    setLastLesson(id)
    runner.boot()
  }, [id])

  // time on task feeds the hint gate; a coarse tick is enough
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const t0 = Date.now()
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - t0) / 1000)), 15_000)
    return () => clearInterval(t)
  }, [id])

  const persist = useCallback(
    (text: string) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setCode(id, text), 350)
    },
    [id],
  )
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current)
      // left the lesson before the celebration popped up: don't ambush the next page, send a toast instead
      const p = pending.current
      if (p) {
        clearTimeout(p.timer)
        const ui = useUi.getState()
        ui.push(p.text, 'success', '✦')
        p.badges.forEach((b) => ui.push(b, 'badge', '🏅'))
      }
    },
    [],
  )

  const finish = useCallback(
    (tries: number) => {
      const sum = completeLesson(id, tries)
      if (!sum) return
      const timer = setTimeout(() => {
        pending.current = null
        useUi.getState().setCelebration({ lessonId: id, xp: sum.xp, levelUp: sum.levelUp, badges: sum.badges, questBonus: sum.questBonus, cardsAdded: sum.cardsAdded, hints: sum.hints })
      }, 700)
      pending.current = { timer, text: `${lesson.title}: +${sum.xp + sum.questBonus} XP`, badges: sum.badges.map((b) => `Achievement unlocked: ${b.name}`) }
    },
    [id, lesson.title],
  )

  const execute = useCallback(
    async (source: string, opts: { check: boolean; complete: boolean; tries?: number }) => {
      const mine = ++token.current
      setRunning(true)
      recordRun(opts.check ? id : undefined, useStore.getState().settings.vim)
      const res = await runner.run({ code: source, check: opts.check && lesson.check ? lesson.check : undefined, packages: lesson.packages })
      if (mine !== token.current) return
      setRunning(false)
      setResult(res)
      attempts.current += 1
      if (opts.complete) {
        const pass = opts.check && lesson.check ? allPassed(res) : res.ok && !res.infra
        if (pass) finish(opts.tries ?? attempts.current)
      }
    },
    [lesson, finish],
  )

  const run = useCallback(() => {
    if (running || isPredict) return
    const source = isParsons ? order.join('\n') : code
    void execute(source, { check: true, complete: true })
  }, [running, isPredict, isParsons, order, code, execute])

  // already-completed predict lessons show their real output straight away
  useEffect(() => {
    if (isPredict && done) void execute(lesson.starter, { check: false, complete: false })
  }, [])

  const runRef = useRef(run)
  runRef.current = run
  useEffect(() => {
    setVimActions({ run: () => runRef.current(), quit: () => go('#/') })
  }, [])

  const choose = (i: number) => {
    if (solved || picked.includes(i)) return
    if (i === lesson.answer) {
      setSolved(true)
      void execute(lesson.starter, { check: false, complete: true, tries: picked.length + 1 })
    } else {
      if (picked.length === 0) missPredict(id)
      setPicked([...picked, i])
    }
  }

  /** start over from the starter with no hints: pass again and the hint penalty is refunded */
  const redo = () => {
    redoLesson(id)
    attempts.current = 0
    setResult(null)
    setPicked([])
    setSolved(false)
    if (isParsons) setOrder(seededShuffle(lesson.lines, lesson.id))
    else setCodeState(lesson.starter)
  }

  const reset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      setTimeout(() => setResetArmed(false), 2500)
      return
    }
    setResetArmed(false)
    if (isParsons) {
      const o = seededShuffle(lesson.lines, lesson.id)
      setOrder(o)
      setCode(id, o.join('\n'))
    } else {
      setCodeState(lesson.starter)
      setCode(id, lesson.starter)
    }
    setResult(null)
  }

  const trackLessons = lessonsOf(lesson.track)
  const idx = trackLessons.findIndex((l) => l.id === id)
  const prev = trackLessons[idx - 1]
  const next = trackLessons[idx + 1]
  const nextChapterId = next ? null : nextLessonId(id)
  const nextChapter = nextChapterId ? LESSON_BY_ID[nextChapterId] : null
  const verdict = result && graded && result.tests.length > 0 ? allPassed(result) : null
  const phaseLabel = runtime.phase === 'error' ? 'Python offline' : runtime.phase === 'booting' ? 'Loading Python…' : runtime.phase === 'running' ? 'Running…' : runtime.phase === 'ready' ? 'Python ready' : 'Python idle'

  return (
    <div className="lesson" style={{ ['--tc' as string]: track.color }}>
      <article className="lesson-pane">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#/">Map</a> <span aria-hidden>›</span> <span style={{ color: track.color }}>{track.glyph} {track.name}</span>
        </nav>
        <header>
          <div className="lesson-meta">
            <span className={`kind kind-${lesson.kind}`}>{KIND_LABEL[lesson.kind]}</span>
            <span className="dim">Step {lesson.order}/9 · {lesson.xp} XP · ~{lesson.minutes} min</span>
            {done && <span className="done-chip">{done.hints === 0 ? '✓ Mastered' : `✓ Completed · ${done.hints} hint${done.hints === 1 ? '' : 's'}`}</span>}
          </div>
          <h1>{lesson.title}</h1>
          <p className="tagline">{lesson.tagline}</p>
          <Difficulty lesson={lesson} />
        </header>
        <LessonWalkthrough lessonId={id} solutionRevealed={hintsUsed >= 3} />
        <Markdown src={lesson.body} />
        <Hints
          lesson={lesson}
          used={hintsUsed}
          completed={!!done && done.hints === 0}
          done={!!done}
          rigor={rigor}
          runs={isPredict ? picked.length : tries}
          seconds={seconds}
          stuckNote={note?.stuck ?? ''}
          onNote={(stuck) => setNote(id, { stuck })}
          onReveal={() => revealHint(id)}
          onUseSolution={(text) => {
            if (isParsons) {
              const o = text.split('\n').filter((l) => l.trim())
              setOrder(o)
              setCode(id, o.join('\n'))
            } else {
              setCodeState(text)
              setCode(id, text)
            }
          }}
        />
        {(done || (isPredict && solved)) && (
          <>
            <section className="lockin">
              <h3>Lock it in</h3>
              <label className="takeaway">
                One sentence, in your own words: why does this work?
                <textarea rows={2} value={note?.takeaway ?? ''} onChange={(e) => setNote(id, { takeaway: e.target.value })} placeholder="Because …" />
              </label>
              {done && (
                <div className="row">
                  <button className="btn small" onClick={redo}>Redo from memory</button>
                  <span className="dim small">{done.hints > 0 ? `Solved with ${done.hints} hint${done.hints === 1 ? '' : 's'}. Pass it again without hints and the XP penalty is refunded.` : 'Mastered without hints. Redo any time to keep it sharp.'}</span>
                </div>
              )}
            </section>
            {isPredict && lesson.explain && (
              <section className="explain">
                <h3>Why</h3>
                <Markdown src={lesson.explain} />
              </section>
            )}
            <section className="recall">
              <h3>Recall cards <span className="dim">· in your Review deck</span></h3>
              {lesson.cards.map((c, i) => (
                <details key={i}>
                  <summary>{c.q}</summary>
                  <div>{c.a}</div>
                </details>
              ))}
            </section>
            {lesson.real && (
              <section className="real">
                <h3>In the real world</h3>
                <Markdown src={lesson.real} />
              </section>
            )}
          </>
        )}
        <footer className="lesson-nav">
          {prev ? (
            <a href={lessonPath(prev.id)} className="btn ghost nav-step">
              <span className="nav-kicker">← {STAGES[prev.order - 1].label}</span>
              <span className="nav-title">{prev.title}</span>
            </a>
          ) : (
            <a href="#/" className="btn ghost nav-step"><span className="nav-kicker">← Map</span><span className="nav-title">All chapters</span></a>
          )}
          {next ? (
            <a href={lessonPath(next.id)} className="btn ghost nav-step nav-next">
              <span className="nav-kicker">{STAGES[next.order - 1].label} →</span>
              <span className="nav-title">{next.title}</span>
            </a>
          ) : nextChapter ? (
            <a href={lessonPath(nextChapter.id)} className="btn ghost nav-step nav-next">
              <span className="nav-kicker">Next chapter →</span>
              <span className="nav-title">{TRACK_BY_ID[nextChapter.track].glyph} {TRACK_BY_ID[nextChapter.track].name}: {nextChapter.title}</span>
            </a>
          ) : (
            <span />
          )}
        </footer>
      </article>

      <section className="workbench" aria-label="Workbench">
        <div className="toolbar">
          <span className="file">{isPredict ? 'read_me.py' : isParsons ? 'arrange.py' : 'cell.py'}</span>
          <span className={`runtime runtime-${runtime.phase}`} title={runtime.detail}><i aria-hidden />{phaseLabel}</span>
          <span className="spacer" />
          {!isPredict && (
            <>
              <button className={`pill ${vimOn ? 'on' : ''}`} onClick={() => setSetting('vim', !vimOn)} aria-pressed={vimOn} title="Toggle Vim keybindings">⌨ Vim {vimOn ? 'on' : 'off'}</button>
              {vimOn && !isParsons && <button className="icon-btn" onClick={() => useUi.getState().set({ cheatOpen: true })} aria-label="Vim cheat sheet" title="Vim cheat sheet">?</button>}
              <button className={`btn small ${resetArmed ? 'danger' : 'ghost'}`} onClick={reset}>{resetArmed ? 'Really reset?' : 'Reset'}</button>
              <button className="btn primary run" onClick={run} disabled={running}>
                {running ? <span className="spinner" aria-hidden /> : '▶'} {graded ? 'Run & Check' : 'Run'} <kbd>⌘↵</kbd>
              </button>
            </>
          )}
        </div>

        {isParsons ? (
          <div className="parsons-wrap">
            <Parsons
              order={order}
              onChange={(o) => {
                setOrder(o)
                persist(o.join('\n'))
              }}
              disabled={running}
            />
          </div>
        ) : (
          <div className={`editor-wrap ${isPredict ? 'predict' : ''}`}>
            <CodeEditor
              docKey={`${id}-${isPredict ? 'ro' : 'rw'}`}
              value={isPredict ? lesson.starter : code}
              readOnly={isPredict}
              vimMode={vimOn}
              onRun={run}
              onChange={(v) => {
                setCodeState(v)
                persist(v)
              }}
            />
          </div>
        )}
        {vimOn && !isPredict && !isParsons && <div className="vim-hint">Vim mode · <code>:w</code> runs · <code>:q</code> back to map · <button className="linklike" onClick={() => useUi.getState().set({ cheatOpen: true })}>cheat sheet</button></div>}

        {isPredict && (
          <div className="choices" role="group" aria-label="What will this print?">
            <div className="choices-title">{solved ? 'Correct!' : 'What does it print?'}</div>
            {lesson.choices.map((c, i) => {
              const wrong = picked.includes(i)
              const right = solved && i === lesson.answer
              return (
                <button key={i} className={`choice ${wrong ? 'wrong' : ''} ${right ? 'right' : ''}`} disabled={solved || wrong} onClick={() => choose(i)}>
                  <span className="choice-key">{String.fromCharCode(65 + i)}</span>
                  <pre>{c}</pre>
                  {wrong && <span className="choice-flag">not quite</span>}
                  {right && <span className="choice-flag">✓</span>}
                </button>
              )
            })}
            {picked.length > 0 && !solved && <p className="dim">Added to your Review deck. Try another option{hintsUsed < 2 ? ' or reveal a hint' : ''}.</p>}
          </div>
        )}

        <OutputPanel key={attempts.current} result={result} running={running} graded={graded} completed={!!done} visualFirst={lesson.kind === 'lab'} />
        {verdict === false && !running && result && (
          <p className="nudge"><strong>Not yet.</strong> {debugMove(attempts.current)}</p>
        )}
      </section>
    </div>
  )
}
