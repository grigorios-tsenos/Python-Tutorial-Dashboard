import type { Plugin } from 'vite'
import type { RunResult } from '../src/engine/types'
export function runLocal(req: { key: string; code: string; signal?: AbortSignal }): Promise<RunResult>
export const localRunner: () => Plugin
import type { IncomingMessage, ServerResponse } from 'node:http'
export function middleware(req: IncomingMessage, res: ServerResponse, next: () => void): void
