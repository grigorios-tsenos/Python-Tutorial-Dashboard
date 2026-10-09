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

export interface CodingStep {
  title: string
  instruction: string
  /** Internal reference for curriculum tests; never show it as the learner's instructions. */
  code: string
  check: string
  expected: string
  reassurance: string
}

export interface CodingGuide {
  setup?: string
  steps: CodingStep[]
}

export const CODING_GUIDES: Record<string, CodingGuide> = {
  ...NUMPY_GUIDES, ...PANDAS_GUIDES, ...PYTHON_GUIDES, ...LANGCHAIN_GUIDES,
  ...LANGGRAPH_GUIDES, ...MLFLOW_GUIDES, ...DATABRICKS_GUIDES, ...CLAUDE_GUIDES,
  ...STATS_GUIDES, ...VIZ_GUIDES, ...ML_GUIDES, ...NN_GUIDES,
}

export function guidedSource(guide: CodingGuide, drafts: string[], step: number): string {
  return [guide.setup ?? '', ...drafts.slice(0, step + 1)].join('\n\n').trim()
}

export function guidedCheck(guide: CodingGuide, step: number, lessonCheck: string): string {
  return [guide.steps[step].check, step === guide.steps.length - 1 ? lessonCheck : ''].filter(Boolean).join('\n')
}
