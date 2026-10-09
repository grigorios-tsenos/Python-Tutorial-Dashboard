import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COURSE, COURSE_BY_KEY, PATH_BY_ID, coursePath, courseXp, fetchCourseLesson, fetchCourseQuiz, nextCourseKey, phaseColor, phasePath, prereqOf, prevCourseKey, splitArticle, stripHeader, typeKind, type CourseFiles, type QuizQuestion } from '../content/course'
import { runLocal } from '../engine/local'
import { runner, useRunnerStatus } from '../engine/runner'
import type { RunResult } from '../engine/types'
import { go } from '../lib/router'
import { seededShuffle } from '../lib/shuffle'
import { DEFAULT_LAYOUT, type Layout } from '../store/model'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'
import { CodeEditor, setVimActions } from './CodeEditor'
import { CourseMarkdown } from './CourseMarkdown'
import { OutputPanel } from './OutputPanel'
import { Quiz } from './Quiz'
import { SplitHandle } from './Split'

export function CourseLessonView({ lessonKey }: { lessonKey: string }) {
  const entry = COURSE_BY_KEY[lessonKey]
  // files travel with their key so a lesson never renders with the previous lesson's content for a frame
  const [loaded, setLoaded] = useState<{ key: string; files: CourseFiles } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setError(null)
    if (!entry) return
    let live = true
    fetchCourseLesson(lessonKey).then((files) => live && setLoaded({ key: lessonKey, files }), (e) => live && setError(String(e?.message ?? e)))
    return () => {
      live = false
    }
  }, [lessonKey])
  const files = loaded?.key === lessonKey ? loaded.files : null

  if (!entry) {
    return (
      <div className="page center">
        <h1>No such lesson</h1>
        <p className="dim">That course lesson isn't in this build.</p>
        <a className="btn primary" href="#/course">Back to the course</a>
      </div>
    )
  }
  if (error) {
    return (
      <div className="page center">
        <h1>Couldn't load the lesson</h1>
        <p className="dim">{error}. Run <code>npm run sync:course</code> if the curriculum files are missing.</p>
        <a className="btn primary" href={phasePath(entry.phase.dir)}>Back to the phase</a>
      </div>
    )
  }
  if (!files) return <div className="boot" role="status"><span className="spinner big" aria-hidden /> Opening lesson…</div>
  return <CourseLessonInner key={lessonKey} lessonKey={lessonKey} files={files} />
}

type Stage = 'warmup' | 'pre' | 'read' | 'check' | 'build' | 'quiz'
const STAGE_NAME: Record<Stage, string> = { warmup: 'Warm-up', pre: 'Predict', read: 'Read', check: 'Check', build: 'Build', quiz: 'Quiz' }

/**
 * One lesson the way the course teaches it: recall from last time, predict before reading, the article up to the build,
 * a check before the production-library part, the script, then the graded quiz.
 */
function CourseLessonInner({ lessonKey, files }: { lessonKey: string; files: CourseFiles }) {
  const { phase, lesson } = COURSE_BY_KEY[lessonKey]
  const color = phaseColor(phase.n)
  const done = useStore((s) => s.course[lessonKey])
  const savedCode = useStore((s) => s.courseCode[lessonKey])
  const vimOn = useStore((s) => s.settings.vim)
  const savedLayout = useStore((s) => s.settings.layout)
  const activePath = useStore((s) => s.coursePathActive)
  const { setCourseCode, setCourseLast, recordRun, completeCourseLesson, setSetting } = useStore.getState()
  const runtime = useRunnerStatus()

  // a learning path the learner follows decides what "previous" and "next" mean
  const pathId = activePath && PATH_BY_ID[activePath]?.lessons.includes(lessonKey) ? activePath : null
  const prev = prevCourseKey(lessonKey, pathId)
  const next = nextCourseKey(lessonKey, pathId)
  const prevDone = useStore((s) => (prev ? s.course[prev] : undefined))

  const local = lesson.needs.length > 0
  const [code, setCodeState] = useState(savedCode ?? files.code ?? '')
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [resetArmed, setResetArmed] = useState(false)
  const [stages, setStages] = useState<Partial<Record<Stage, boolean>>>({})
  const [warmup, setWarmup] = useState<QuizQuestion[] | null>(null)
  const token = useRef(0)
  const abort = useRef<AbortController | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mark = (s: Stage) => setStages((st) => (st[s] ? st : { ...st, [s]: true }))

  useEffect(() => {
    setCourseLast(lessonKey)
    if (files.code && !local) runner.boot()
    return () => {
      clearTimeout(saveTimer.current)
      abort.current?.abort()
    }
  }, [lessonKey])

  // Step 1 of the tutor loop: two questions from the previous lesson's quiz, only when that lesson is done and this one is not
  useEffect(() => {
    if (!prev || !prevDone || done) return
    let live = true
    fetchCourseQuiz(prev).then((qs) => live && qs.length && setWarmup(seededShuffle(qs, String(Date.now())).slice(0, 2)), () => {})
    return () => {
      live = false
    }
  }, [prev, !!prevDone, !!done])

  const pre = useMemo(() => files.quiz.filter((q) => q.stage === 'pre'), [files.quiz])
  const check = useMemo(() => files.quiz.filter((q) => q.stage === 'check'), [files.quiz])
  const post = useMemo(() => {
    const p = files.quiz.filter((q) => q.stage === 'post')
    return p.length ? p : files.quiz
  }, [files.quiz])
  const [head, tail] = useMemo(() => splitArticle(stripHeader(files.md)), [files.md])

  const [layout, setLayoutState] = useState<Layout>(savedLayout)
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const commitLayout = (patch: Partial<Layout>) => {
    const next = { ...layoutRef.current, ...patch }
    setLayoutState(next)
    setSetting('layout', next)
  }
  const lessonEl = useRef<HTMLDivElement>(null)
  const panesEl = useRef<HTMLDivElement>(null)

  const persist = (text: string) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setCourseCode(lessonKey, text), 350)
  }

  const run = useCallback(async () => {
    if (running) return
    const mine = ++token.current
    setRunning(true)
    recordRun(undefined, useStore.getState().settings.vim)
    let res: RunResult
    if (local) {
      abort.current = new AbortController()
      res = await runLocal(lessonKey, code, abort.current.signal)
    } else res = await runner.run({ code, packages: lesson.packages })
    if (mine !== token.current) return
    setRunning(false)
    setResult(res)
    if (res.ok) mark('build')
  }, [code, running, lesson.packages, local, lessonKey])
  const runRef = useRef(run)
  runRef.current = run
  useEffect(() => {
    setVimActions({ run: () => void runRef.current(), quit: () => go(phasePath(phase.dir)) })
  }, [phase.dir])

  const reset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      setTimeout(() => setResetArmed(false), 2500)
      return
    }
    setResetArmed(false)
    setCodeState(files.code ?? '')
    setCourseCode(lessonKey, files.code ?? '')
  }

  const finish = (score: number, total: number) => {
    mark('quiz')
    const sum = completeCourseLesson(lessonKey, score, total)
    const ui = useUi.getState()
    if (!sum) {
      if (total > 0 && score / total < 0.7) ui.push('Under 70 %: the lesson joins your review queue. Skim what you missed and retake', 'info', '↻')
      return
    }
    ui.push(`${lesson.title}: +${sum.xp + sum.questBonus} XP${sum.redo ? ' (better score)' : ''}`, 'success', '✦')
    if (sum.levelUp) ui.push(`Level ${sum.levelUp} reached`, 'badge', '🏅')
    const course = useStore.getState().course
    if (phase.lessons.every((l) => course[`${phase.dir}/${l.dir}`])) ui.push(`Phase ${phase.n} complete. Take the phase check from the course page`, 'badge', '🎓')
  }

  const scrollTo = (id: Stage) => document.getElementById(`stage-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const flow: Stage[] = [...(warmup ? ['warmup' as const] : []), ...(pre.length ? ['pre' as const] : []), 'read', ...(check.length ? ['check' as const] : []), ...(files.code ? ['build' as const] : []), 'quiz']
  const prereq = prereqOf(files.md)
  const hasCode = !!files.code
  const phaseLabel = local ? 'Runs on this machine · uv' : runtime.phase === 'error' ? 'Python offline' : runtime.phase === 'booting' ? 'Loading Python…' : runtime.phase === 'running' ? 'Running…' : runtime.phase === 'ready' ? 'Python ready' : 'Python idle'
  const xp = courseXp(lesson.minutes)

  return (
    <div ref={lessonEl} className={`lesson ${hasCode ? '' : 'reading'}`} style={{ ['--tc' as string]: color, ['--guide' as string]: `${layout.guide * 100}%`, ['--editor' as string]: `${layout.editor * 100}%` }}>
      <article className="lesson-pane">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#/course">Course</a> <span aria-hidden>›</span> <a href={phasePath(phase.dir)} style={{ color }}>Phase {phase.n} · {phase.title}</a>
          {pathId && <> <span aria-hidden>›</span> <a href={`#/course/path/${pathId}`}>{PATH_BY_ID[pathId].title}</a></>}
        </nav>
        <header>
          <div className="lesson-meta">
            <span className="kind">{typeKind(lesson.type)}</span>
            <span className="dim">Lesson {lesson.n}/{phase.lessons.length} · ~{lesson.minutes} min · {xp} XP{lesson.langs ? ` · ${lesson.langs}` : ''}</span>
            {done && <span className="done-chip">✓ {done.total ? `Passed ${done.score}/${done.total}` : 'Read'}</span>}
          </div>
          <h1>{lesson.title}</h1>
          <p className="tagline">{lesson.tagline}</p>
          {prereq && <p className="dim small course-prereq"><strong>Prerequisites:</strong> {prereq}</p>}
        </header>

        <nav className="flow" aria-label="Lesson flow">
          {flow.map((s, i) => (
            <button key={s} className={stages[s] || (s === 'quiz' && done) ? 'done' : ''} onClick={() => scrollTo(s)}><i>{stages[s] || (s === 'quiz' && done) ? '✓' : i + 1}</i>{STAGE_NAME[s]}</button>
          ))}
        </nav>

        {warmup && prev && (
          <section id="stage-warmup" className="card stage stage-warmup" aria-label="Warm-up">
            <h2>Warm-up · from {COURSE_BY_KEY[prev].lesson.title}</h2>
            <p className="dim small">Two questions from last time, no stakes. Recalling after a gap is what moves it to long-term memory.</p>
            <Quiz questions={warmup} formative onFinish={() => mark('warmup')} />
          </section>
        )}

        {pre.length > 0 && (
          <details id="stage-pre" className="card stage stage-pre" open={!done}>
            <summary><h2>Before you read · {pre.length} prediction{pre.length > 1 ? 's' : ''}</h2></summary>
            <p className="dim small">Commit to an answer first; the lesson then confirms or corrects it.</p>
            <Quiz questions={pre} formative onFinish={() => mark('pre')} />
          </details>
        )}

        <div id="stage-read">
          <CourseMarkdown src={head} lessonKey={lessonKey} />
        </div>

        {check.length > 0 && (
          <details id="stage-check" className="card stage stage-check" open={!done}>
            <summary><h2>Check · {check.length} question{check.length > 1 ? 's' : ''} before the library version</h2></summary>
            <Quiz questions={check} formative onFinish={() => mark('check')} />
          </details>
        )}

        {tail && <CourseMarkdown src={tail} lessonKey={lessonKey} />}

        <section id="stage-quiz" className="card quiz-card" aria-label="Quiz">
          <h2>{post.length ? `Quiz · ${post.length} question${post.length > 1 ? 's' : ''}, 70 % passes` : 'Done reading?'}</h2>
          {post.length ? (
            <Quiz questions={post} done={done} onFinish={finish} />
          ) : done ? (
            <p className="dim">Marked as read. The next lesson is one click below.</p>
          ) : (
            <>
              <p className="dim">This lesson has no quiz. Mark it as read once you've worked through it{hasCode ? ' and run the script' : ''}.</p>
              <button className="btn primary" onClick={() => finish(0, 0)}>Mark as read · +{xp} XP</button>
            </>
          )}
        </section>

        <footer className="lesson-nav">
          {prev ? <a className="btn ghost" href={coursePath(prev)}>← {COURSE_BY_KEY[prev].lesson.title}</a> : <span />}
          {next ? <a className="btn ghost" href={coursePath(next)}>Next: {COURSE_BY_KEY[next].lesson.title} →</a> : <a className="btn ghost" href="#/course">Back to the course</a>}
        </footer>
        <p className="dim small course-source">
          Source: <a href={`${COURSE.source}/tree/main/phases/${lessonKey}`} target="_blank" rel="noopener">phases/{lessonKey}</a> (MIT).
        </p>
      </article>

      {hasCode && (
        <>
          <SplitHandle axis="x" value={layout.guide} min={0.22} max={0.65} container={lessonEl} label="Resize article" onChange={(guide) => setLayoutState((l) => ({ ...l, guide }))} onCommit={(guide) => commitLayout({ guide })} onReset={() => commitLayout({ guide: DEFAULT_LAYOUT.guide })} />
          <section id="stage-build" className="workbench" aria-label="Code">
            <div className="toolbar">
              <span className="file">main.py</span>
              <span className={`runtime runtime-${local ? (running ? 'running' : 'local') : runtime.phase}`} title={local ? 'uv run --python 3.12 on this machine (CPU)' : runtime.detail}><i aria-hidden />{running && local ? 'Running on this machine…' : phaseLabel}</span>
              <span className="spacer" />
              <button className={`pill ${vimOn ? 'on' : ''}`} onClick={() => setSetting('vim', !vimOn)} aria-pressed={vimOn} title="Toggle Vim keybindings">⌨ Vim {vimOn ? 'on' : 'off'}</button>
              <button className={`btn small ${resetArmed ? 'danger' : 'ghost'}`} onClick={reset}>{resetArmed ? 'Really reset?' : 'Reset'}</button>
              {local && running ? (
                <button className="btn danger run" onClick={() => abort.current?.abort()}>■ Stop</button>
              ) : (
                <button className="btn primary run" onClick={() => void run()} disabled={running}>
                  {running ? <span className="spinner" aria-hidden /> : '▶'} Run <kbd>⌘↵</kbd>
                </button>
              )}
            </div>
            {local && (
              <p className="course-needs">
                This script imports <strong>{lesson.needs.join(', ')}</strong>, which the browser can't load, so Run executes it on this machine through <code>uv</code> (Python 3.12, CPU or Apple GPU, no CUDA needed). The first run installs the packages; needs <code>npm run dev</code>.
              </p>
            )}
            <div className="panes" ref={panesEl}>
              <div className="editor-wrap">
                <CodeEditor
                  docKey={`course-${lessonKey}`}
                  value={code}
                  vimMode={vimOn}
                  onRun={() => void runRef.current()}
                  onChange={(v) => {
                    setCodeState(v)
                    persist(v)
                  }}
                />
              </div>
              <SplitHandle axis="y" value={layout.editor} min={0.25} max={0.85} container={panesEl} label="Resize editor" onChange={(editor) => setLayoutState((l) => ({ ...l, editor }))} onCommit={(editor) => commitLayout({ editor })} onReset={() => commitLayout({ editor: DEFAULT_LAYOUT.editor })} />
              <OutputPanel result={result} running={running} graded={false} completed={!!done} emptyMessage={local ? 'Run executes the script on this machine; output lands here when it finishes.' : 'Run the lesson script to see what it prints. Edit it freely; Reset restores the original.'} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
