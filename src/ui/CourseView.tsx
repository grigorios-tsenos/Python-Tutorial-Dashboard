import { useMemo, useState } from 'react'
import { COURSE, COURSE_BY_KEY, COURSE_LESSONS, PATH_BY_ID, PHASE_BY_DIR, continueKey, coursePath, courseXp, learningPathPath, phaseColor, phaseGrade, phasePath, phaseStatus, typeKind, type CourseEntry, type PhaseStatus } from '../content/course'
import { planFromPhase, planHours } from '../content/placement'
import { go } from '../lib/router'
import { useStore } from '../store/useStore'
import { PhaseCheck } from './PhaseCheck'
import { Placement } from './Placement'

const hours = (minutes: number) => (minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`)
const STATUS_LABEL: Record<PhaseStatus | 'done', string> = { skip: 'Skip', review: 'Review', do: 'Do', done: 'Done' }

function LessonRow({ entry, number }: { entry: CourseEntry; number: string }) {
  const done = useStore((s) => s.course[entry.key])
  const review = useStore((s) => s.courseReview[entry.key])
  const { lesson } = entry
  return (
    <a className={`course-row ${done ? 'done' : review ? 'review' : ''}`} href={coursePath(entry.key)} style={{ ['--tc' as string]: phaseColor(entry.phase.n) }}>
      <span className="course-n">{number}</span>
      <span className="course-main">
        <span className="course-title">
          <span className="kind">{typeKind(lesson.type)}</span> {lesson.title}
        </span>
        <span className="course-tagline dim">{lesson.tagline}</span>
      </span>
      <span className="course-facts dim small">
        <span title="Reading time">{lesson.minutes} min</span>
        {lesson.code && <span title={lesson.needs.length ? `Script needs ${lesson.needs.join(', ')}: runs on this machine through uv` : 'Script runs in your browser'}>{lesson.needs.length ? '⌘ code' : '▶ code'}</span>}
        {lesson.quiz > 0 && <span title={`${lesson.quiz} quiz questions`}>? {lesson.quiz}</span>}
        <span className="course-xp">{done ? `✓ ${done.total ? `${done.score}/${done.total}` : 'read'}` : review ? '↻ review' : `${courseXp(lesson.minutes)} XP`}</span>
      </span>
    </a>
  )
}

export function CourseView({ phase, path }: { phase?: string; path?: string }) {
  const progress = useStore((s) => s.course)
  const courseLast = useStore((s) => s.courseLast)
  const plan = useStore((s) => s.coursePlan)
  const review = useStore((s) => s.courseReview)
  const checks = useStore((s) => s.coursePhaseCheck)
  const activePath = useStore((s) => s.coursePathActive)
  const { setCoursePlan, setPhaseStatus, setCoursePath } = useStore.getState()
  const [placing, setPlacing] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const doneCount = Object.keys(progress).length
  const earned = Object.values(progress).reduce((a, p) => a + p.xp, 0)

  const next = useMemo(() => continueKey(progress, courseLast, plan, activePath), [courseLast, progress, plan, activePath])
  const learningPath = path ? PATH_BY_ID[path] : undefined
  const current = (phase && PHASE_BY_DIR[phase]) || (next ? COURSE_BY_KEY[next].phase : COURSE.phases[0])
  const doneIn = (dir: string) => PHASE_BY_DIR[dir].lessons.filter((l) => progress[`${dir}/${l.dir}`]).length
  const statusOf = (dir: string): PhaseStatus | 'done' => (doneIn(dir) === PHASE_BY_DIR[dir].lessons.length ? 'done' : phaseStatus(plan, dir))
  const totalMinutes = COURSE_LESSONS.reduce((a, e) => a + e.lesson.minutes, 0)
  const reviewKeys = Object.keys(review).filter((k) => COURSE_BY_KEY[k] && !progress[k])
  const todo = plan ? COURSE.phases.filter((p) => plan.status[p.dir] !== 'skip') : COURSE.phases
  const following = !!learningPath && activePath === learningPath.id

  return (
    <div className="page course-page">
      <header className="course-head">
        <div>
          <div className="eyebrow">Course · the long road</div>
          <h1>AI Engineering from Scratch</h1>
          <p className="dim">
            {COURSE_LESSONS.length} lessons in {COURSE.phases.length} phases, about {hours(totalMinutes)} of reading, code and quizzes. Each lesson goes predict → read → check → build → quiz, the way the course teaches it. Scripts run in your browser where they can and on this machine (CPU, through uv) where they can't.
            {' '}Content from <a href={COURSE.source} target="_blank" rel="noopener">rohitg00/ai-engineering-from-scratch</a> (MIT), synced {COURSE.syncedAt}.
          </p>
        </div>
        <div className="course-progress glass">
          <div className="stat-num">{doneCount} <span className="dim">/ {COURSE_LESSONS.length}</span></div>
          <div className="meter wide"><i style={{ width: `${(doneCount / COURSE_LESSONS.length) * 100}%` }} /></div>
          <div className="dim small">{earned} XP earned from the course</div>
          {next && (
            <a className="btn primary" href={coursePath(next)}>
              {doneCount ? 'Continue' : 'Start'}{activePath && PATH_BY_ID[activePath] ? ` ${PATH_BY_ID[activePath].title}` : ''}: {COURSE_BY_KEY[next].lesson.title} →
            </a>
          )}
          {plan ? (
            <div className="dim small plan-line">
              Plan: start at Phase {plan.entry}{plan.score !== null ? `, placed ${plan.score}/10` : ', chosen by you'} · ~{planHours(plan, COURSE.phases)} h across {todo.length} phases ·{' '}
              <button className="link" onClick={() => setPlacing(true)}>re-place</button> · <button className="link" onClick={() => setCoursePlan(null)}>clear</button>
            </div>
          ) : (
            <div className="plan-cta">
              <button className="btn ghost small" onClick={() => setPlacing(true)}>Find your level · 10 questions</button>
              <select aria-label="Start at a phase" value="" onChange={(e) => e.target.value && setCoursePlan(planFromPhase(Number(e.target.value), COURSE.phases))}>
                <option value="">or start at phase…</option>
                {COURSE.phases.map((p) => <option key={p.dir} value={p.n}>{p.n} · {p.title}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>

      {placing && (
        <Placement
          onDone={(p) => {
            setCoursePlan(p)
            setPlacing(false)
            go(phasePath(COURSE.phases.find((ph) => ph.n === p.entry)!.dir))
          }}
          onCancel={() => setPlacing(false)}
        />
      )}

      <nav className="course-paths" aria-label="Learning paths">
        <a className={`pill ${!learningPath ? 'on' : ''}`} href="#/course">All phases</a>
        {COURSE.paths.map((p) => (
          <a key={p.id} className={`pill ${learningPath?.id === p.id ? 'on' : ''}`} href={learningPathPath(p.id)} title={p.summary}>{activePath === p.id ? '✓ ' : ''}{p.title}</a>
        ))}
      </nav>

      {learningPath ? (
        <section className="course-body single">
          <div className="course-lessons">
            <h2>{learningPath.title} <span className="dim">· {learningPath.lessons.length} lessons · {hours(learningPath.minutes)}</span></h2>
            <p className="dim">{learningPath.summary}</p>
            <div className="row phase-tools">
              <button className={`btn small ${following ? 'primary' : 'ghost'}`} onClick={() => setCoursePath(following ? null : learningPath.id)} aria-pressed={following}>
                {following ? '✓ Following this path' : 'Follow this path'}
              </button>
              <span className="dim small">{following ? 'Continue and next/previous follow this order instead of the phase order.' : 'Paths jump between phases in a curated order.'}</span>
            </div>
            {learningPath.lessons.map((key, i) => (
              <LessonRow key={key} entry={COURSE_BY_KEY[key]} number={String(i + 1).padStart(2, '0')} />
            ))}
          </div>
        </section>
      ) : (
        <section className="course-body">
          <ol className="phase-rail" aria-label="Phases">
            {COURSE.phases.map((p) => {
              const done = doneIn(p.dir)
              const st = statusOf(p.dir)
              return (
                <li key={p.dir}>
                  <a className={`phase-link ${p.dir === current.dir ? 'active' : ''} ${st === 'done' ? 'complete' : st}`} href={phasePath(p.dir)} style={{ ['--tc' as string]: phaseColor(p.n) }} aria-current={p.dir === current.dir ? 'true' : undefined}>
                    <span className="phase-n">{String(p.n).padStart(2, '0')}</span>
                    <span className="phase-title">{p.title}</span>
                    {plan && <span className={`phase-status ${st}`}>{STATUS_LABEL[st]}</span>}
                    <span className="phase-count">{done}/{p.lessons.length}</span>
                    <span className="meter"><i style={{ width: `${(done / p.lessons.length) * 100}%` }} /></span>
                  </a>
                </li>
              )
            })}
          </ol>
          <div className="course-lessons" style={{ ['--tc' as string]: phaseColor(current.n) }}>
            {reviewKeys.length > 0 && (
              <section className="card review-queue" aria-label="Review queue">
                <h2>Review queue <span className="dim">· {reviewKeys.length} under 70 %</span></h2>
                {reviewKeys.slice(0, 6).map((key) => (
                  <LessonRow key={key} entry={COURSE_BY_KEY[key]} number={String(COURSE_BY_KEY[key].lesson.n).padStart(2, '0')} />
                ))}
              </section>
            )}
            <div className="eyebrow" style={{ color: 'var(--tc)' }}>Phase {current.n} · ~{current.hours} h</div>
            <h2>{current.title}</h2>
            <p className="dim">{current.blurb} {doneIn(current.dir)}/{current.lessons.length} done · {hours(current.lessons.reduce((a, l) => a + l.minutes, 0))}.</p>
            <div className="row phase-tools">
              <label className="dim small">
                Status{' '}
                <select value={phaseStatus(plan, current.dir)} onChange={(e) => setPhaseStatus(current.dir, e.target.value as PhaseStatus)}>
                  {(['do', 'review', 'skip'] as const).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <button className="btn ghost small" onClick={() => setChecking(checking === current.dir ? null : current.dir)}>Phase check · 8 questions</button>
              {checks[current.dir] && <span className="chip" title="Best phase check">{checks[current.dir].score}/{checks[current.dir].total} · {phaseGrade(checks[current.dir].score, checks[current.dir].total).label}</span>}
            </div>
            {checking === current.dir && <PhaseCheck phase={current} onClose={() => setChecking(null)} />}
            {current.lessons.map((l) => (
              <LessonRow key={l.dir} entry={COURSE_BY_KEY[`${current.dir}/${l.dir}`]} number={String(l.n).padStart(2, '0')} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
