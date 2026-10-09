import { useEffect, useRef } from 'react'
import type { Lesson } from '../content/types'
import { useStore } from '../store/useStore'
import { Markdown } from './Markdown'

const READING_GUIDES: Record<string, string[]> = {
  'np-views': [
    'Import NumPy. This makes the name `np` available; it does not create an array yet.',
    'Read `arange(5)` as “integers starting at zero, stopping before five”. Write those five values down.',
    'Trace the slice from index 1 up to, but excluding, index 4. Which positions in `a` does `b` refer to? A NumPy slice shares the original memory.',
    'Follow the assignment through that shared memory. Which index in `a` corresponds to index zero in `b`?',
    'The print reads `a`, after the assignment. Compare your traced values with the choices below before running anything.',
  ],
  'py-generators': [
    'The next five indented lines define a function. Defining a function stores its body; it does not run that body.',
    'This print is inside the function. Keep it on your “runs later” list for now.',
    'The loop will visit the two strings in order when the generator is advanced.',
    '`yield` hands one value back to the caller and pauses here. Think about where execution will resume on a later request.',
    'This print comes after the pause. Has the caller asked for a second value yet?',
    'Calling a generator function creates an iterator. Does creating that iterator advance it?',
    'This print is outside the function. Put it on your output list at the moment Python reaches it.',
    '`next(gen)` advances to the first `yield`, then the outer `print` prints the returned token. Trace the order of the prints and compare with the choices.',
  ],
  'lc-prompts': [
    'Import the prompt-template class. No messages have been constructed yet.',
    'Start a template from a list of role-and-text pairs. The closing bracket a few lines below finishes this statement.',
    'Count this system-message pair. Its text has no replacement field.',
    'Count this human-message pair. Keep track of the placeholder named `term`.',
    'The list is complete. How many role-and-text pairs did you count?',
    'Pass a value for `term`, then turn the filled prompt into messages. Track whether the placeholder remains literal text.',
    'Index 1 selects the second message. Work out the message count and that message’s content, then choose the output below.',
  ],
  'db-nulls': [
    'Import the Spark session class. This is setup; it does not filter any rows.',
    'Import column expressions as `F`. A column expression describes a calculation on each row.',
    'Create the session that will build the small example table.',
    'Read each row separately. Note which tag is a string and which tag is missing (`None`, or SQL NULL).',
    'For each row, classify `tag != "a"` as true, false, or unknown. A filter keeps only true. Count those rows, then choose below.',
  ],
  'st-zscore': [
    'Import NumPy. Nothing is computed yet.',
    'Five values. Add them up and divide by five to get the mean; notice how far the 50 pulls it above the other four.',
    'A z-score for every value: subtract the mean, divide by the standard deviation. The 50 also inflates that standard deviation, so work out roughly how many spreads each value is from the mean.',
    'Two things are printed: how many absolute z-scores exceed 1.5, and the last value’s z-score rounded to one decimal. Compare your trace with the choices below.',
  ],
  'sk-overfit': [
    'Import a decision tree regressor. With no depth limit it can give every training point its own leaf.',
    'Import linear regression: two adjustable numbers, a slope and an intercept.',
    'Six training inputs, 1 through 6.',
    'Six training targets, each close to twice its input but with a small wobble.',
    'Three new inputs halfway between training points: 1.5, 3.5 and 5.5.',
    'Their true targets, exactly on the line y = 2x.',
    'The loop visits the tree first, then the line, with its name.',
    'Fit the model to the six training points. Ask yourself: can this model reproduce every training target exactly?',
    'Print the name, the training R² and the test R², each rounded to one decimal. Think about which model scores a perfect 1.0 on training data and which predicts the midpoints well.',
  ],
  'nn-loss': [
    'Import NumPy for the logarithm.',
    'Define the loss: it will receive a probability vector and the index of the true class.',
    'The loss is minus the natural log of the probability given to the true class. Only that one entry matters.',
    'A confident, correct prediction: the true class (index 0) gets 0.9.',
    'A hedged prediction: the true class gets 0.4.',
    'A confident, wrong prediction: the true class gets only 0.05.',
    'The loop visits the three predictions in that order.',
    'Each line prints −log of 0.9, 0.4 and 0.05, rounded to two decimals. Estimate the three values (−ln 0.9 ≈ 0.1, −ln 0.4 ≈ 0.9, −ln 0.05 ≈ 3) and compare with the choices.',
  ],
  'vz-hist': [
    'Import NumPy for the array.',
    'Import matplotlib; this lesson reads its return values rather than looking at the picture.',
    'Eight values from 1 to 8, with a gap between 4 and 8. Note the smallest and largest.',
    'A figure with one axes.',
    'Four equal-width bins between the minimum and the maximum: work out the bin width as (8 − 1) / 4, then the four edges, and place each value. The last bin includes its right edge.',
    'Print the four counts as ints and the width of the first bin. Compare your bin counts with the choices below.',
  ],
}

export function PredictionGuide({ lesson, onReady }: { lesson: Lesson; onReady: (ready: boolean) => void }) {
  const lines = lesson.starter.split('\n').filter(line => line.trim())
  const saved = useStore(s => s.guided[lesson.id])
  const heading = useRef<HTMLHeadingElement>(null)
  const index = Math.min(saved?.step ?? 0, lines.length - 1)
  const move = (step: number) => {
    useStore.getState().setGuided(lesson.id, { step, drafts: lines })
    requestAnimationFrame(() => heading.current?.focus())
  }
  const last = index === lines.length - 1
  useEffect(() => { onReady(last) }, [last, onReady])

  return (
    <section className="prediction-guide" aria-label="Read the code line by line">
      <div className="guided-progress">Read & trace · line {index + 1} of {lines.length}<progress aria-label="Reading progress" value={index + 1} max={lines.length} /></div>
      <h2 ref={heading} tabIndex={-1}>Line {index + 1}: what does this line do?</h2>
      <Markdown src={'```python\n' + lines[index] + '\n```'} />
      <Markdown src={READING_GUIDES[lesson.id]?.[index] ?? 'Track the names this line reads and the value it creates. Note anything it prints.'} />
      <p className="guided-expected"><strong>Verify your reasoning:</strong> keep a short list of values and printed lines. You will compare your prediction with real Python output after choosing an answer.</p>
      <div className="guided-actions">
        <button className="btn small ghost" disabled={index === 0} onClick={() => move(index - 1)}>← Previous line</button>
        {!last && <button className="btn small primary" onClick={() => move(index + 1)}>Next line →</button>}
      </div>
      <p role="status">{last ? 'You have traced every line. Make your prediction below; it is fine to try again if your trace needs adjusting.' : 'Take your time. You do not need to hold the whole program in your head.'}</p>
      <details className="guided-code"><summary>Review the lines read so far</summary><pre><code>{lines.slice(0, index + 1).join('\n')}</code></pre></details>
    </section>
  )
}
