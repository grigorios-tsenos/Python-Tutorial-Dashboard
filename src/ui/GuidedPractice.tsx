import { useEffect, useRef, useState, type RefObject } from 'react'
import { guidedCheck, guidedSource, type CodingGuide } from '../content/guided'
import type { Lesson } from '../content/types'
import { allPassed } from '../engine/outputText'
import { runner } from '../engine/runner'
import type { RunResult } from '../engine/types'
import { useStore } from '../store/useStore'
import { CodeEditor } from './CodeEditor'
import { Markdown } from './Markdown'
import { OutputPanel } from './OutputPanel'

interface Props {
  lesson: Lesson
  guide: CodingGuide
  runRef: RefObject<(() => void) | null>
  onComplete: (tries: number) => void
}

export function GuidedPractice({ lesson, guide, runRef, onComplete }: Props) {
  const saved = useStore(s => s.guided[lesson.id])
  const vim = useStore(s => s.settings.vim)
  const index = Math.min(saved?.step ?? 0, guide.steps.length - 1)
  const drafts = saved?.drafts ?? []
  const draft = drafts[index] ?? ''
  const step = guide.steps[index]
  const last = index === guide.steps.length - 1
  const source = guidedSource(guide, drafts, index)
  const identity = JSON.stringify([index, source])
  const [checked, setChecked] = useState<{ identity: string; result: RunResult } | null>(null)
  const result = checked?.identity === identity ? checked.result : null
  const [running, setRunning] = useState(false)
  const busy = useRef(false)
  const token = useRef(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const passed = result !== null && !result.infra && allPassed(result)

  useEffect(() => () => { token.current++ }, [])

  const save = (nextIndex: number, nextDrafts = drafts) => {
    token.current++
    setChecked(null)
    useStore.getState().setGuided(lesson.id, { step: nextIndex, drafts: nextDrafts })
  }
  const move = (nextIndex: number) => {
    save(nextIndex)
    requestAnimationFrame(() => heading.current?.focus())
  }

  const run = async () => {
    if (busy.current || !draft.trim()) return
    busy.current = true
    setRunning(true)
    setChecked(null)
    const mine = ++token.current
    const store = useStore.getState()
    store.recordRun(last ? lesson.id : undefined, vim)
    const res = await runner.run({ code: source, check: guidedCheck(guide, index, lesson.check), packages: lesson.packages })
    busy.current = false
    setRunning(false)
    if (mine !== token.current) return
    const latest = useStore.getState().guided[lesson.id]
    const latestIndex = Math.min(latest?.step ?? 0, guide.steps.length - 1)
    if (latestIndex !== index || guidedSource(guide, latest?.drafts ?? [], latestIndex) !== source) return
    setChecked({ identity, result: res })
    if (last && !res.infra && allPassed(res)) onComplete(useStore.getState().tries[lesson.id] ?? 1)
  }

  useEffect(() => {
    runRef.current = () => { void run() }
    return () => { runRef.current = null }
  })

  return (
    <div className="guided-practice">
      <div className="guided-task" aria-label="Current coding step">
        <div className="guided-progress"><span>Write & check · step {index + 1} of {guide.steps.length}</span><progress aria-label="Guided progress" value={index + (passed ? 1 : 0)} max={guide.steps.length} /></div>
        <h2 ref={heading} tabIndex={-1}>Step {index + 1}: {step.title}</h2>
        <Markdown src={step.instruction} />
        <p className="small dim">Write your own approach below, then check its behavior. Your code runs after earlier steps. When changing a function or class, write its updated definition here.</p>
        <div className="guided-expected"><strong>What to verify</strong><Markdown src={step.expected} /><span className="small dim">Some steps create a value without printing. The checks below inspect it for you.</span></div>
      </div>
      <div className="guided-editor" aria-label="Write the current step">
        <CodeEditor docKey={`guided-${lesson.id}-${index}`} value={draft} hoverPrefix={guidedSource(guide, drafts, index - 1)} ariaLabel={`Write step ${index + 1}: ${step.title}`} vimMode={vim} onRun={() => { void run() }} onChange={text => {
          const next = [...drafts]
          next[index] = text
          save(index, next)
        }} />
      </div>
      <div className="guided-actions">
        <button className="btn small ghost" disabled={running || index === 0} onClick={() => move(index - 1)}>← Previous step</button>
        <button className="btn primary guided-check" disabled={running || !draft.trim()} onClick={() => { void run() }}>{running ? 'Checking…' : last ? 'Check full program' : 'Check this step'} <kbd>⌘↵</kbd></button>
        {!last && <button className="btn small" disabled={!passed || running} onClick={() => move(index + 1)}>Next step →</button>}
      </div>
      <div className={`guided-feedback ${passed ? 'pass' : ''}`} role="status">
        {running ? 'Checking your code. Take a moment to predict the result.' : passed ? <><strong>{last ? '✓ Lesson verified. ' : '✓ This step works. '}</strong>{step.reassurance}{last ? ' All exercise checks passed.' : ' Continue when you feel ready.'}</> : result?.infra ? 'Python could not check this step yet. Your draft is saved; retry when it is ready.' : result ? <>You’re still on the same step, and your earlier work is saved. Read the first error or failing check below, compare it with “What to verify”, and change one thing.</> : 'One step at a time is enough. You can retry as often as you need; your draft is saved as you type.'}
      </div>
      <OutputPanel result={result} running={running} graded completed={false} visualFirst={lesson.kind === 'lab' || lesson.track === 'viz'} showTestMessages={false} emptyMessage="Use the check button above. The verification result and any printed output will appear here." />
      {result?.error && <p className="guided-code small dim">Error line numbers refer to the combined program in “Provided setup and your code so far”.</p>}
      <details className="guided-code"><summary>Provided setup and your code so far</summary><pre><code>{guidedSource(guide, drafts, index) || 'Your code will appear here as you write.'}</code></pre></details>
    </div>
  )
}
