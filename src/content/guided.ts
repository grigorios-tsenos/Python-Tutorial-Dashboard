import { NUMPY_GUIDES } from './guides/numpy'
import { PANDAS_GUIDES } from './guides/pandas'
import { PYTHON_GUIDES } from './guides/python'
import { LANGCHAIN_GUIDES } from './guides/langchain'
import { LANGGRAPH_GUIDES } from './guides/langgraph'
import { MLFLOW_GUIDES } from './guides/mlflow'
import { DATABRICKS_GUIDES } from './guides/databricks'
import { CLAUDE_GUIDES } from './guides/claude'
import { STATS_GUIDES } from './guides/stats'
import { VIZ_GUIDES } from './guides/viz'
import { ML_GUIDES } from './guides/ml'
import { NN_GUIDES } from './guides/nn'
import { RAG_GUIDES } from './guides/rag'

export interface CodingStep {
  title: string
  instruction: string
  /** Internal reference for curriculum tests; never show it as the learner's instructions. */
  code: string
  check: string
  expected: string
  /** shown once the step passes: a short takeaway, or '' when the check says it all */
  reassurance: string
  /** earlier steps whose drafts open this step's editor, so a wrap or an update edits the learner's own code instead of retyping it */
  startFrom?: number[]
}

export interface CodingGuide {
  setup?: string
  steps: CodingStep[]
}

export const CODING_GUIDES: Record<string, CodingGuide> = {
  ...NUMPY_GUIDES, ...PANDAS_GUIDES, ...PYTHON_GUIDES, ...LANGCHAIN_GUIDES,
  ...LANGGRAPH_GUIDES, ...MLFLOW_GUIDES, ...DATABRICKS_GUIDES, ...CLAUDE_GUIDES,
  ...STATS_GUIDES, ...VIZ_GUIDES, ...ML_GUIDES, ...NN_GUIDES, ...RAG_GUIDES,
}

export function guidedSource(guide: CodingGuide, drafts: string[], step: number): string {
  return [guide.setup ?? '', ...drafts.slice(0, step + 1)].join('\n\n').trim()
}

export function guidedCheck(guide: CodingGuide, step: number, lessonCheck: string): string {
  return [guide.steps[step].check, step === guide.steps.length - 1 ? lessonCheck : ''].filter(Boolean).join('\n')
}

/** What the editor shows for a step the learner has not written yet: their own drafts of the steps it builds on. */
export function seedDraft(guide: CodingGuide, drafts: string[], step: number): string {
  return (guide.steps[step].startFrom ?? []).map(i => (drafts[i] ?? '').trimEnd()).filter(Boolean).join('\n')
}
