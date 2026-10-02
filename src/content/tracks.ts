import type { Track } from './types'

export const TRACKS: Track[] = [
  { id: 'numpy', name: 'NumPy', glyph: '∿', color: '#2dd4bf', blurb: 'Arrays, broadcasting and the maths behind every embedding.', x: 330, y: 330, tilt: -12 },
  { id: 'pandas', name: 'Pandas', glyph: '▦', color: '#facc15', blurb: 'Tabular data wrangling: clean, join, aggregate, feature-engineer.', x: 930, y: 230, tilt: 8 },
  { id: 'python', name: 'Python for AI', glyph: 'λ', color: '#60a5fa', blurb: 'Dataclasses, pydantic, generators and async: the glue of AI code.', x: 1530, y: 360, tilt: -6 },
  { id: 'langchain', name: 'LangChain', glyph: '⛓', color: '#4ade80', blurb: 'Prompts, chains, tools and retrieval, composed with the | operator.', x: 2100, y: 250, tilt: 10 },
  { id: 'langgraph', name: 'LangGraph', glyph: '◈', color: '#a78bfa', blurb: 'Agents as state machines: routing, memory, human-in-the-loop.', x: 2020, y: 880, tilt: -10 },
  { id: 'mlflow', name: 'MLflow', glyph: '◎', color: '#f472b6', blurb: 'Track experiments, compare runs, register models, evaluate prompts.', x: 1380, y: 800, tilt: 6 },
  { id: 'databricks', name: 'Databricks', glyph: '◆', color: '#f87171', blurb: 'Spark DataFrames, Delta tables, time travel and the medallion pattern.', x: 760, y: 900, tilt: -8 },
  { id: 'claude', name: 'Claude Code', glyph: '✦', color: '#fdba74', blurb: 'Permissions, hooks, skills: configure an agent you can trust.', x: 300, y: 860, tilt: 12 },
]

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t])) as Record<Track['id'], Track>
export const MAP_SIZE = { w: 2420, h: 1180 }
