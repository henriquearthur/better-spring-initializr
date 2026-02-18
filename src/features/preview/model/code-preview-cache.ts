import type { BuiltinLanguage, ThemedToken } from 'shiki'

export type CodePreviewCacheOptions = {
  maxTokenEntries?: number
  maxLineEntries?: number
}

export type HighlightTokenCacheKey = {
  fileHash: string
  theme: string
  language: BuiltinLanguage
}

export type CodePreviewCache = {
  getSplitLines: (fileHash: string, content: string) => string[]
  getTokenLines: (key: HighlightTokenCacheKey) => ThemedToken[][] | null
  setTokenLines: (key: HighlightTokenCacheKey, tokenLines: ThemedToken[][]) => void
  clear: () => void
}

const DEFAULT_MAX_TOKEN_ENTRIES = 96
const DEFAULT_MAX_LINE_ENTRIES = 192

class LruCache<TKey, TValue> {
  readonly #maxEntries: number
  readonly #cache = new Map<TKey, TValue>()

  constructor(maxEntries: number) {
    this.#maxEntries = Math.max(1, maxEntries)
  }

  get(key: TKey): TValue | undefined {
    const value = this.#cache.get(key)

    if (value === undefined) {
      return undefined
    }

    this.#cache.delete(key)
    this.#cache.set(key, value)
    return value
  }

  set(key: TKey, value: TValue): void {
    if (this.#cache.has(key)) {
      this.#cache.delete(key)
    }

    this.#cache.set(key, value)

    if (this.#cache.size <= this.#maxEntries) {
      return
    }

    const oldestKey = this.#cache.keys().next().value

    if (oldestKey !== undefined) {
      this.#cache.delete(oldestKey)
    }
  }

  clear(): void {
    this.#cache.clear()
  }
}

export function createCodePreviewCache(options: CodePreviewCacheOptions = {}): CodePreviewCache {
  const tokenLineCache = new LruCache<string, ThemedToken[][]>(
    options.maxTokenEntries ?? DEFAULT_MAX_TOKEN_ENTRIES,
  )
  const splitLineCache = new LruCache<string, string[]>(options.maxLineEntries ?? DEFAULT_MAX_LINE_ENTRIES)

  return {
    getSplitLines(fileHash, content) {
      const cached = splitLineCache.get(fileHash)

      if (cached) {
        return cached
      }

      const lines = splitTextLines(content)
      splitLineCache.set(fileHash, lines)
      return lines
    },
    getTokenLines(key) {
      return tokenLineCache.get(buildHighlightCacheKey(key)) ?? null
    },
    setTokenLines(key, tokenLines) {
      tokenLineCache.set(buildHighlightCacheKey(key), tokenLines)
    },
    clear() {
      tokenLineCache.clear()
      splitLineCache.clear()
    },
  }
}

export const codePreviewCache = createCodePreviewCache()

function buildHighlightCacheKey({ fileHash, theme, language }: HighlightTokenCacheKey): string {
  return `${fileHash}|${theme}|${language}`
}

function splitTextLines(content: string): string[] {
  return content.replace(/\r\n/g, '\n').split('\n')
}
