/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    include: [
      process.env['TEST_LEARN'] ? '**/*.learn.ts' : '**\/*.{test,spec}.?(c|m)[jt]s?(x)'
    ]
  },
})
