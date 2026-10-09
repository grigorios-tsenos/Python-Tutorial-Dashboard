export const TIPS = [
  'In NumPy, axis=0 collapses the rows. The axis you name is the one that disappears.',
  'An LLM never runs a tool. It only asks. Your code does the doing.',
  'pd.to_numeric(col, errors="coerce") turns "oops" into NaN instead of a crash.',
  'Delta tables keep every version. A bad overwrite is a SELECT … VERSION AS OF away from fixed.',
  'Pin an agent to a checkpointer and you get memory and a pause button for free.',
  'Params are inputs, metrics are outputs. If it changes between runs on purpose, it\'s a param.',
  'A deny rule in Claude Code always beats an allow rule.',
  'Cosine similarity ignores length. That\'s why it works for embeddings.',
  'Broadcasting aligns shapes from the right. A 1 stretches to match.',
  'Make pipelines idempotent: running twice should be as safe as running once.',
  'Prompts are suggestions. Hooks are guarantees.',
  'In Vim, ciw changes the word under your cursor. Try it in the editor.',
  'Report p95, not the mean: one slow request should not hide behind a hundred fast ones.',
  'A model scoring 100% on the test set has a leak, not a breakthrough. Audit the features.',
  'predict() hides a 0.5 cutoff. Choose the threshold from the cost of a miss.',
  'Start bar charts at zero. A truncated axis turns half a point into a cliff.',
  'Softmax + cross-entropy has the gradient probs - onehot. Everything else is the chain rule.',
  'Start a Focus sprint before a lesson: a finite block of work is easier to begin.',
]

export function tipOfTheDay(dayKey: string): string {
  let h = 0
  for (const ch of dayKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TIPS[h % TIPS.length]
}
