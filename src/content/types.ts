export type TrackId = 'numpy' | 'pandas' | 'python' | 'langchain' | 'langgraph' | 'mlflow' | 'databricks' | 'claude'

export type LessonKind = 'run' | 'lab' | 'predict' | 'bug' | 'parsons' | 'build' | 'boss'

export interface Flashcard {
  q: string
  a: string
}

export interface Lesson {
  id: string
  track: TrackId
  order: number
  title: string
  tagline: string
  kind: LessonKind
  xp: number
  minutes: number
  packages: string[]
  /** markdown shown in the lesson pane */
  body: string
  /** editor starter (predict: the code being read) */
  starter: string
  solution: string
  /** python run after the learner's code; uses test(label, fn) */
  check: string
  /** exactly two text hints; the third tier is the solution */
  hints: string[]
  /** predict: options (each is a literal expected output) and the correct index */
  choices: string[]
  answer: number
  explain: string
  /** parsons: lines in one valid order */
  lines: string[]
  cards: Flashcard[]
  /** note about the real library */
  real: string
}

export interface Track {
  id: TrackId
  name: string
  glyph: string
  color: string
  blurb: string
  /** position of the constellation centre on the map canvas */
  x: number
  y: number
  /** rotation of the star arc in degrees */
  tilt: number
}

export const KIND_LABEL: Record<LessonKind, string> = {
  run: 'Run & Tweak',
  lab: 'Visual Lab',
  predict: 'Predict',
  bug: 'Bug Hunt',
  parsons: 'Puzzle',
  build: 'Build',
  boss: 'Boss',
}
