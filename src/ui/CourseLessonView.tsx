import { useCallback, useEffect, useRef, useState } from 'react'
import { COURSE, COURSE_BY_KEY, coursePath, courseXp, fetchCourseLesson, nextCourseKey, phaseColor, phasePath, prereqOf, prevCourseKey, stripHeader, typeKind, type CourseFiles } from '../content/course'
import { runner, useRunnerStatus } from '../engine/runner'
import type { RunResult } from '../engine/types'
import { go } from '../lib/router'
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
  const [files, setFiles] = useState<CourseFiles | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setFiles(null)
    setError(null)
    if (!entry) return
    let live = true
    fetchCourseLesson(lessonKey).then((f) => live && setFiles(f), (e) => live && setError(String(e?.message ?? e)))
    return () => {
      live = false
    }
  }, [lessonKey])

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

function CourseLessonInner({ lessonKey, files }: { lessonKey: string; files: CourseFiles }) {
  const { phase, lesson } = COURSE_BY_KEY[lessonKey]
  const color = phaseColor(phase.n)
  const done = useStore((s) => s.course[lessonKey])
  const savedCode = useStore((s) => s.courseCode[lessonKey])
  const vimOn = useStore((s) => s.settings.vim)
  const savedLayout = useStore((s) => s.settings.layout)
  const { setCourseCode, setCourseLast, recordRun, completeCourseLesson, setSetting } = useStore.getState()
  const runtime = useRunnerStatus()

  const [code, setCodeState] = useState(savedCode ?? files.code ?? '')
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [resetArmed, setResetArmed] = useState(false)
  const token = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setCourseLast(lessonKey)
    if (files.code && !lesson.needs.length) runner.boot()
    return () => clearTimeout(saveTimer.current)
  }, [lessonKey])

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
    const res = await runner.run({ code, packages: lesson.packages })
    if (mine !== token.current) return
    setRunning(false)
    setResult(res)
  }, [code, running, lesson.packages])
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
    const sum = completeCourseLesson(lessonKey, score, total)
    const ui = useUi.getState()
    if (!sum) {
      if (total > 0 && score / total < 0.7) ui.push('Under 70 %: review the misses and retake the quiz', 'info', '↻')
      return
    }
    ui.push(`${lesson.title}: +${sum.xp + sum.questBonus} XP${sum.redo ? ' (better score)' : ''}`, 'success', '✦')
    if (sum.levelUp) ui.push(`Level ${sum.levelUp} reached`, 'badge', '🏅')
  }

  const prev = prevCourseKey(lessonKey)
  const next = nextCourseKey(lessonKey)
  const prereq = prereqOf(files.md)
  const hasCode = !!files.code
  const phaseLabel = runtime.phase === 'error' ? 'Python offline' : runtime.phase === 'booting' ? 'Loading Python…' : runtime.phase === 'running' ? 'Running…' : runtime.phase === 'ready' ? 'Python ready' : 'Python idle'
  const xp = courseXp(lesson.minutes)

  return (
    <div ref={lessonEl} className={`lesson ${hasCode ? '' : 'reading'}`} style={{ ['--tc' as string]: color, ['--guide' as string]: `${layout.guide * 100}%`, ['--editor' as string]: `${layout.editor * 100}%` }}>
      <article className="lesson-pane">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#/course">Course</a> <span aria-hidden>›</span> <a href={phasePath(phase.dir)} style={{ color }}>Phase {phase.n} · {phase.title}</a>
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

        <CourseMarkdown src={stripHeader(files.md)} lessonKey={lessonKey} />

        <section className="card quiz-card" aria-label="Quiz">
          <h2>{files.quiz.length ? 'Check your understanding' : 'Done reading?'}</h2>
          {files.quiz.length ? (
            <Quiz questions={files.quiz} done={done} onFinish={finish} />
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
          {next ? <a className="btn ghost" href={coursePath(next)}>{COURSE_BY_KEY[next].lesson.title} →</a> : <a className="btn ghost" href="#/course">Back to the course</a>}
        </footer>
        <p className="dim small course-source">
          Source: <a href={`${COURSE.source}/tree/main/phases/${lessonKey}`} target="_blank" rel="noopener">phases/{lessonKey}</a> (MIT).
        </p>
      </article>

      {hasCode && (
        <>
          <SplitHandle axis="x" value={layout.guide} min={0.22} max={0.65} container={lessonEl} label="Resize article" onChange={(guide) => setLayoutState((l) => ({ ...l, guide }))} onCommit={(guide) => commitLayout({ guide })} onReset={() => commitLayout({ guide: DEFAULT_LAYOUT.guide })} />
          <section className="workbench" aria-label="Code">
            <div className="toolbar">
              <span className="file">main.py</span>
              <span className={`runtime runtime-${runtime.phase}`} title={runtime.detail}><i aria-hidden />{phaseLabel}</span>
              <span className="spacer" />
              <button className={`pill ${vimOn ? 'on' : ''}`} onClick={() => setSetting('vim', !vimOn)} aria-pressed={vimOn} title="Toggle Vim keybindings">⌨ Vim {vimOn ? 'on' : 'off'}</button>
              <button className={`btn small ${resetArmed ? 'danger' : 'ghost'}`} onClick={reset}>{resetArmed ? 'Really reset?' : 'Reset'}</button>
              <button className="btn primary run" onClick={() => void run()} disabled={running}>
                {running ? <span className="spinner" aria-hidden /> : '▶'} Run <kbd>⌘↵</kbd>
              </button>
            </div>
            {lesson.needs.length > 0 && (
              <p className="course-needs">
                This script imports <strong>{lesson.needs.join(', ')}</strong>, which can't load in the browser. Read and edit it here; to run it, clone the course and use <code>python phases/{lessonKey}/code/main.py</code>.
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
              <OutputPanel result={result} running={running} graded={false} completed={!!done} emptyMessage="Run the lesson script to see what it prints. Edit it freely; Reset restores the original." />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
