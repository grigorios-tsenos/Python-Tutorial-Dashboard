/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localRunner } from './scripts/local-runner.mjs'

export default defineConfig({
  plugins: [react(), localRunner()],
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 120_000, hookTimeout: 240_000, environment: 'node' },
})
