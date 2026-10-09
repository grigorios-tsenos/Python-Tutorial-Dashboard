import { useMemo } from 'react'
import { COURSE, COURSE_BY_KEY, COURSE_LESSONS, PATH_BY_ID, PHASE_BY_DIR, coursePath, courseXp, learningPathPath, nextCourseKey, phaseColor, phasePath, typeKind, type CourseEntry } from '../content/course'
import { useStore } from '../store/useStore'

const hours = (minutes: number) => (minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`)

function LessonRow({ entry, number }: { entry: CourseEntry; number: string }) {
  const done = useStore((s) => s.course[entry.key])
  const { lesson } = entry
  return (
    <a className={`course-row ${done ? 'done' : ''}`} href={coursePath(entry.key)} style={{ ['--tc' as string]: phaseColor(entry.phase.n) }}>
      <span className="course-n">{number}</span>
      <span className="course-main">
        <span className="course-title">
          <span className="kind">{typeKind(lesson.type)}</span> {lesson.title}
        </span>
        <span className="course-tagline dim">{lesson.tagline}</span>
      </span>
      <span className="course-facts dim small">
        <span title="Reading time">{lesson.minutes} min</span>
        {lesson.code && <span title={lesson.needs.length ? `Script needs ${lesson.needs.join(', ')}: read it here, run it locally` : 'Script runs in your browser'}>{lesson.needs.length ? '▢ code' : '▶ code'}</span>}
        {lesson.quiz > 0 && <span title={`${lesson.quiz} quiz questions`}>? {lesson.quiz}</span>}
        <span className="course-xp">{done ? `✓ ${done.total ? `${done.score}/${done.total}` : 'read'}` : `${courseXp(lesson.minutes)} XP`}</span>
      </span>
    </a>
  )
}

export function CourseView({ phase, path }: { phase?: string; path?: string }) {
  const progress = useStore((s) => s.course)
  const courseLast = useStore((s) => s.courseLast)
  const doneCount = Object.keys(progress).length
  const earned = Object.values(progress).reduce((a, p) => a + p.xp, 0)

  const continueKey = useMemo(() => {
    if (courseLast && !progress[courseLast]) return courseLast
    const after = courseLast ? nextCourseKey(courseLast) : null
    if (after && !progress[after]) return after
    return COURSE_LESSONS.find((e) => !progress[e.key])?.key ?? null
  }, [courseLast, progress])

  const learningPath = path ? PATH_BY_ID[path] : undefined
  const current = (phase && PHASE_BY_DIR[phase]) || (continueKey ? COURSE_BY_KEY[continueKey].phase : COURSE.phases[0])
  const doneIn = (dir: string) => PHASE_BY_DIR[dir].lessons.filter((l) => progress[`${dir}/${l.dir}`]).length
  const totalMinutes = COURSE_LESSONS.reduce((a, e) => a + e.lesson.minutes, 0)

  return (
    <div className="page course-page">
      <header className="course-head">
        <div>
          <div className="eyebrow">Course · the long road</div>
          <h1>AI Engineering from Scratch</h1>
          <p className="dim">
            {COURSE_LESSONS.length} lessons in {COURSE.phases.length} phases, about {hours(totalMinutes)} of reading, code and quizzes. Scripts run in your browser where they can; the rest you read here and run locally.
            {' '}Content from <a href={COURSE.source} target="_blank" rel="noopener">rohitg00/ai-engineering-from-scratch</a> (MIT), synced {COURSE.syncedAt}.
          </p>
        </div>
        <div className="course-progress glass">
          <div className="stat-num">{doneCount} <span className="dim">/ {COURSE_LESSONS.length}</span></div>
          <div className="meter wide"><i style={{ width: `${(doneCount / COURSE_LESSONS.length) * 100}%` }} /></div>
          <div className="dim small">{earned} XP earned from the course</div>
          {continueKey && (
            <a className="btn primary" href={coursePath(continueKey)}>
              {doneCount ? 'Continue' : 'Start'}: {COURSE_BY_KEY[continueKey].lesson.title} →
            </a>
          )}
        </div>
      </header>

      <nav className="course-paths" aria-label="Learning paths">
        <a className={`pill ${!learningPath ? 'on' : ''}`} href="#/course">All phases</a>
        {COURSE.paths.map((p) => (
          <a key={p.id} className={`pill ${learningPath?.id === p.id ? 'on' : ''}`} href={learningPathPath(p.id)} title={p.summary}>{p.title}</a>
        ))}
      </nav>

      {learningPath ? (
        <section className="course-body single">
          <div className="course-lessons">
            <h2>{learningPath.title} <span className="dim">· {learningPath.lessons.length} lessons · {hours(learningPath.minutes)}</span></h2>
            <p className="dim">{learningPath.summary}</p>
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
              return (
                <li key={p.dir}>
                  <a className={`phase-link ${p.dir === current.dir ? 'active' : ''} ${done === p.lessons.length ? 'complete' : ''}`} href={phasePath(p.dir)} style={{ ['--tc' as string]: phaseColor(p.n) }} aria-current={p.dir === current.dir ? 'true' : undefined}>
                    <span className="phase-n">{String(p.n).padStart(2, '0')}</span>
                    <span className="phase-title">{p.title}</span>
                    <span className="phase-count">{done}/{p.lessons.length}</span>
                    <span className="meter"><i style={{ width: `${(done / p.lessons.length) * 100}%` }} /></span>
                  </a>
                </li>
              )
            })}
          </ol>
          <div className="course-lessons" style={{ ['--tc' as string]: phaseColor(current.n) }}>
            <div className="eyebrow" style={{ color: 'var(--tc)' }}>Phase {current.n}</div>
            <h2>{current.title}</h2>
            <p className="dim">{current.blurb} {doneIn(current.dir)}/{current.lessons.length} done · {hours(current.lessons.reduce((a, l) => a + l.minutes, 0))}.</p>
            {current.lessons.map((l) => (
              <LessonRow key={l.dir} entry={COURSE_BY_KEY[`${current.dir}/${l.dir}`]} number={String(l.n).padStart(2, '0')} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
