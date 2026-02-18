import type { BuiltinLanguage, ThemedToken } from 'shiki'
import { describe, expect, it } from 'vitest'

import { createCodePreviewCache } from './code-preview-cache'

function token(content: string): ThemedToken {
  return {
    content,
    offset: 0,
    color: '#1f2937',
  }
}

function createKey(fileHash: string, language: BuiltinLanguage) {
  return {
    fileHash,
    language,
    theme: 'github-light-default',
  }
}

describe('createCodePreviewCache', () => {
  it('returns cached tokens for the same hash + theme + language', () => {
    const cache = createCodePreviewCache({ maxTokenEntries: 4 })
    const key = createKey('hash-a', 'java')
    const tokens = [[token('class Demo {}')]]

    cache.setTokenLines(key, tokens)

    expect(cache.getTokenLines(key)).toBe(tokens)
  })

  it('evicts the oldest token entry when LRU capacity is exceeded', () => {
    const cache = createCodePreviewCache({ maxTokenEntries: 2 })
    const keyA = createKey('hash-a', 'java')
    const keyB = createKey('hash-b', 'java')
    const keyC = createKey('hash-c', 'java')

    cache.setTokenLines(keyA, [[token('A')]])
    cache.setTokenLines(keyB, [[token('B')]])
    cache.setTokenLines(keyC, [[token('C')]])

    expect(cache.getTokenLines(keyA)).toBeNull()
    expect(cache.getTokenLines(keyB)).not.toBeNull()
    expect(cache.getTokenLines(keyC)).not.toBeNull()
  })

  it('reuses split lines by file hash', () => {
    const cache = createCodePreviewCache({ maxLineEntries: 2 })

    const first = cache.getSplitLines('hash-demo', 'first\nsecond')
    const second = cache.getSplitLines('hash-demo', 'first\nsecond')

    expect(second).toBe(first)
    expect(second).toEqual(['first', 'second'])
  })
})
