import type { Track } from './types'

/** Learning order: foundations, then statistics and machine learning, then the AI-engineering stack. */
export const TRACKS: Track[] = [
  { id: 'numpy', name: 'NumPy', glyph: '∿', color: '#2dd4bf', blurb: 'Arrays, broadcasting and the maths behind every embedding.', x: 420, y: 330, tilt: -12 },
  { id: 'pandas', name: 'Pandas', glyph: '▦', color: '#facc15', blurb: 'Tabular data wrangling: clean, join, aggregate, feature-engineer.', x: 1220, y: 250, tilt: 8 },
  { id: 'stats', name: 'Statistics', glyph: 'σ', color: '#7dd3fc', blurb: 'Averages that lie, spread, sampling, confidence intervals and honest A/B tests.', x: 2020, y: 350, tilt: -6 },
  { id: 'viz', name: 'Visualization', glyph: '⟋', color: '#fb7185', blurb: 'Plots that tell the truth: curves, scatter, bars, scales, annotations.', x: 2800, y: 260, tilt: 10 },
  { id: 'ml', name: 'Machine Learning', glyph: '⚙', color: '#e879f9', blurb: 'scikit-learn end to end: split, fit, evaluate, pipeline, cross-validate, ship.', x: 2760, y: 900, tilt: -10 },
  { id: 'nn', name: 'Neural Nets', glyph: '⌬', color: '#a3e635', blurb: 'Neurons, forward pass, loss, gradients, backprop and attention, all in NumPy.', x: 1980, y: 830, tilt: 6 },
  { id: 'python', name: 'Python for AI', glyph: 'λ', color: '#60a5fa', blurb: 'Dataclasses, pydantic, generators and async: the glue of AI code.', x: 1180, y: 910, tilt: -8 },
  { id: 'langchain', name: 'LangChain', glyph: '⛓', color: '#4ade80', blurb: 'Prompts, chains, tools and retrieval, composed with the | operator.', x: 420, y: 860, tilt: 12 },
  { id: 'langgraph', name: 'LangGraph', glyph: '◈', color: '#a78bfa', blurb: 'Agents as state machines: routing, memory, human-in-the-loop.', x: 420, y: 1480, tilt: -10 },
  { id: 'mlflow', name: 'MLflow', glyph: '◎', color: '#f472b6', blurb: 'Track experiments, compare runs, register models, evaluate prompts.', x: 1220, y: 1420, tilt: 8 },
  { id: 'databricks', name: 'Databricks', glyph: '◆', color: '#f87171', blurb: 'Spark DataFrames, Delta tables, time travel and the medallion pattern.', x: 2020, y: 1500, tilt: -6 },
  { id: 'claude', name: 'Claude Code', glyph: '✦', color: '#fdba74', blurb: 'Permissions, hooks, skills: configure an agent you can trust.', x: 2800, y: 1440, tilt: 10 },
]

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t])) as Record<Track['id'], Track>
export const MAP_SIZE = { w: 3220, h: 1800 }
