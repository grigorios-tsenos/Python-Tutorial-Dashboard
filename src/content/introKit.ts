/** Building blocks for lesson intros: the code-free warm-up and the animated core demo. */
export interface WalkthroughCell { id: string; text: string }
export interface WalkthroughArea { label: string; rows: WalkthroughCell[][] }
export interface PredictionCheck { question: string; options: string[]; answer: number; explanation: string }
export interface WalkthroughStep { check?: PredictionCheck; nesting?: string; title: string; explanation: string; code: string; areas: WalkthroughArea[] }
export interface Walkthrough { purpose: string; steps: WalkthroughStep[]; question: string; answer: string }
export interface Warmup extends Walkthrough { review: string[] }

// Stable cell IDs let the same value move between positions and stages.
export const area = (label: string, rows: [string, string][][]): WalkthroughArea => ({ label, rows: rows.map((row) => row.map(([id, text]) => ({ id, text }))) })
export const step = (title: string, explanation: string, code: string, ...areas: WalkthroughArea[]): WalkthroughStep => ({ title, explanation, code, areas })
export const walk = (purpose: string, question: string, answer: string, ...steps: WalkthroughStep[]): Walkthrough => ({ purpose, question, answer, steps })
export const small = (title: string, explanation: string, ...areas: WalkthroughArea[]) => step(title, explanation, '', ...areas)
export const warmup = (purpose: string, review: string[], question: string, options: string[], answer: number, explanation: string, ...steps: Walkthrough['steps']): Warmup => {
  steps[steps.length - 1].check = { question, options, answer, explanation }
  return { purpose, review, steps, question, answer: explanation }
}
