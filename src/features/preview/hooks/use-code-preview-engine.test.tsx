import { describe, expect, it, vi } from 'vitest'

import { type HighlightPolicy,scheduleWhenIdle, shouldSkipHighlighting } from './use-code-preview-engine'

const DEFAULT_POLICY: HighlightPolicy = {
  maxBytesForHighlight: 300 * 1024,
  maxLinesForHighlight: 5_000,
  idleTimeoutMs: 120,
}

describe('highlight policy', () => {
  it('skips highlighting for large files', () => {
    expect(shouldSkipHighlighting(500_000, 320, DEFAULT_POLICY)).toBe(true)
  })

  it('does not skip highlighting for small files', () => {
    expect(shouldSkipHighlighting(12_000, 120, DEFAULT_POLICY)).toBe(false)
  })

  it('schedules highlight work asynchronously for small files', async () => {
    const work = vi.fn()

    scheduleWhenIdle(work, 100)

    expect(work).not.toHaveBeenCalled()

    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

    expect(work).toHaveBeenCalledTimes(1)
  })
})
