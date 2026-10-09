// The curriculum's placement quiz (skills/find-your-level): 5 areas × 2 questions map a score to an entry phase,
// and a 1/2 in an area marks that area's phases "Review" instead of "Skip". Transcribed from the skill and its answer key.
import type { CoursePhase, CoursePlan, PhaseStatus } from './course'

export const AREAS = ['Math & Statistics', 'Classical ML', 'Deep Learning', 'NLP & Transformers', 'Applied AI'] as const
/** phases to mark Review when the area scores 1/2 */
const AREA_PHASES = [[1], [2], [3], [5, 7], [14]]

export interface PlacementQuestion {
  area: number
  question: string
  options: string[]
  correct: number
  explanation: string
}

export const PLACEMENT: PlacementQuestion[] = [
  { area: 0, question: 'You have two vectors, a = [1, 2, 3] and b = [4, 5, 6]. What is their dot product?', options: ['32', '21', '15', '27'], correct: 0, explanation: 'The dot product is 1·4 + 2·5 + 3·6 = 32.' },
  { area: 0, question: 'A fair coin is flipped 3 times. What is the probability of getting exactly 2 heads?', options: ['1/4', '1/2', '1/8', '3/8'], correct: 3, explanation: 'Exactly two heads has probability C(3,2) · (1/2)³ = 3/8.' },
  { area: 1, question: 'In a classification task with 90% negative and 10% positive samples, a model predicts everything as negative. What is its accuracy?', options: ['50%', '90%', '10%', '0%'], correct: 1, explanation: 'It gets the 90% negatives right and misses the 10% positives, so accuracy is 90%.' },
  { area: 1, question: 'Which of the following is a hyperparameter of a Random Forest?', options: ['The learned split thresholds', 'The leaf node predictions', 'The number of trees', 'The Gini impurity at each node'], correct: 2, explanation: 'The number of trees is configured before training; thresholds, leaf predictions and impurity are learned or calculated during fitting.' },
  { area: 2, question: 'During backpropagation, what does the chain rule compute?', options: ['The loss gradient for each trainable weight', 'The best learning rate for the current optimizer', 'The exact number of layers the network requires', 'The batch size used for each training step'], correct: 0, explanation: 'The chain rule propagates derivatives so the loss gradient can be computed with respect to each weight.' },
  { area: 2, question: 'What problem do residual connections (skip connections) in ResNet primarily address?', options: ['Poor generalization on small training datasets', 'Slow loading of batches from persistent storage', 'High activation memory during model inference', 'Weak gradient flow through very deep networks'], correct: 3, explanation: 'Residual paths give gradients a shorter route through deep networks, reducing degradation from vanishing gradients.' },
  { area: 3, question: 'In the Transformer architecture, what does the attention mechanism compute between?', options: ['Pixels and labels', 'Encoder and Decoder only', 'Queries, Keys, and Values', 'Embeddings and positions only'], correct: 2, explanation: 'Attention compares queries with keys and uses the resulting weights to combine values.' },
  { area: 3, question: 'What is the main benefit of LoRA (Low-Rank Adaptation) when fine-tuning a large language model?', options: ['It retrains every base-model parameter from a completely fresh initialization', 'It trains low-rank adapters while the base-model weights stay frozen', 'It removes the need for labeled examples or task-specific training data', 'It duplicates the model layers to increase its adaptation capacity'], correct: 1, explanation: 'LoRA freezes the base model and trains small low-rank update matrices, reducing the number of trainable parameters.' },
  { area: 4, question: 'In a RAG (Retrieval-Augmented Generation) system, what happens before the LLM generates an answer?', options: ['Relevant documents are retrieved and added to the model prompt', 'The whole model is fully retrained on the user\'s current question', 'The user selects every context passage before each model request', 'The model searches only its pretrained parameter values'], correct: 0, explanation: 'A RAG pipeline retrieves relevant material and supplies it as context before the language model generates an answer.' },
  { area: 4, question: 'In a multi-agent system, what is the primary purpose of a "coordinator" or "orchestrator" agent?', options: ['To replace every specialist agent with one general-purpose model', 'To assign tasks, route messages, and coordinate the other agents', 'To maximize token usage across every agent interaction', 'To keep an identical backup model ready for system failures'], correct: 1, explanation: 'A coordinator decomposes work, assigns tasks, routes messages, and manages collaboration among specialized agents.' },
]

/** total score 0–10 → the phase to start at */
export const entryPhase = (score: number) => (score <= 3 ? 1 : score <= 5 ? 3 : score <= 7 ? 7 : score <= 9 ? 11 : 14)

/** Skip below the entry point (Review where an area scored 1/2), Do from the entry point on; Phase 0 is always Skip. */
export function planFromPlacement(areas: number[], phases: CoursePhase[], at = Date.now()): CoursePlan {
  const score = areas.reduce((a, b) => a + b, 0)
  const entry = entryPhase(score)
  const review = new Set(AREA_PHASES.flatMap((ps, i) => (areas[i] === 1 ? ps : [])))
  const status: Record<string, PhaseStatus> = {}
  for (const p of phases) status[p.dir] = p.n === 0 ? 'skip' : p.n >= entry ? 'do' : review.has(p.n) ? 'review' : 'skip'
  return { at, score, areas, entry, status }
}

/** "just start me at phase 7": everything below is Skip, the rest Do, no score */
export function planFromPhase(entry: number, phases: CoursePhase[], at = Date.now()): CoursePlan {
  const status: Record<string, PhaseStatus> = {}
  for (const p of phases) status[p.dir] = p.n < entry || p.n === 0 ? 'skip' : 'do'
  return { at, score: null, areas: [], entry, status }
}

export const planHours = (plan: CoursePlan, phases: CoursePhase[]) => phases.filter((p) => (plan.status[p.dir] ?? 'do') !== 'skip').reduce((a, p) => a + p.hours, 0)
