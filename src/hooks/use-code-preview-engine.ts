import { useEffect, useMemo, useRef, useState } from 'react'
import { codeToTokens, type BuiltinLanguage, type ThemedToken } from 'shiki'

import {
  codePreviewCache,
  type CodePreviewCache,
  type HighlightTokenCacheKey,
} from '@/lib/code-preview-cache'
import { inferCodePreviewLanguage } from '@/lib/code-preview-language'
import type { PreviewSnapshotFile } from '@/lib/preview-tree'

const SHIKI_LIGHT_THEME = 'github-light-default'
const SHIKI_DARK_THEME = 'github-dark-default'

export type HighlightPolicy = {
  maxBytesForHighlight: number
  maxLinesForHighlight: number
  idleTimeoutMs: number
}

export type CodePreviewEngineStatus = 'idle' | 'running' | 'done' | 'skipped' | 'failed'

export type CodePreviewEngineResult = {
  lines: string[]
  tokenLines: ThemedToken[][] | null
  status: CodePreviewEngineStatus
  message?: string
  language: BuiltinLanguage | null
}

type CodePreviewEngineState = Pick<CodePreviewEngineResult, 'tokenLines' | 'status' | 'message'>

export type CodePreviewHighlighter = (args: {
  content: string
  language: BuiltinLanguage
  theme: string
}) => Promise<ThemedToken[][]>

export type IdleTaskScheduler = (work: () => void, timeoutMs: number) => () => void

type UseCodePreviewEngineInput = {
  file: PreviewSnapshotFile | null
  isDarkMode: boolean
  policy?: Partial<HighlightPolicy>
  cache?: CodePreviewCache
  highlighter?: CodePreviewHighlighter
  scheduler?: IdleTaskScheduler
}

const DEFAULT_HIGHLIGHT_POLICY: HighlightPolicy = {
  maxBytesForHighlight: 300 * 1024,
  maxLinesForHighlight: 5_000,
  idleTimeoutMs: 120,
}

const defaultHighlighter: CodePreviewHighlighter = async ({ content, language, theme }) => {
  const highlighted = await codeToTokens(content, {
    lang: language,
    theme,
  })

  return highlighted.tokens
}

export const scheduleWhenIdle: IdleTaskScheduler = (work, timeoutMs) => {
  const host = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
    cancelIdleCallback?: (id: number) => void
  }

  if (typeof host.requestIdleCallback === 'function') {
    const callbackId = host.requestIdleCallback(work, { timeout: timeoutMs })

    return () => {
      host.cancelIdleCallback?.(callbackId)
    }
  }

  const timeoutId = globalThis.setTimeout(work, 0)

  return () => {
    globalThis.clearTimeout(timeoutId)
  }
}

export function useCodePreviewEngine({
  file,
  isDarkMode,
  policy,
  cache,
  highlighter,
  scheduler,
}: UseCodePreviewEngineInput): CodePreviewEngineResult {
  const resolvedCache = cache ?? codePreviewCache
  const resolvedHighlighter = highlighter ?? defaultHighlighter
  const resolvedScheduler = scheduler ?? scheduleWhenIdle
  const resolvedPolicy = useMemo(
    () => ({
      ...DEFAULT_HIGHLIGHT_POLICY,
      ...policy,
    }),
    [policy],
  )

  const theme = isDarkMode ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME
  const language = useMemo(() => inferCodePreviewLanguage(file?.path), [file?.path])

  const lines = useMemo(() => {
    if (!file || file.binary || file.content === undefined) {
      return []
    }

    return resolvedCache.getSplitLines(file.hash, file.content)
  }, [file?.binary, file?.content, file?.hash, resolvedCache])

  const [state, setState] = useState<CodePreviewEngineState>({
    tokenLines: null,
    status: 'idle',
    message: undefined,
  })
  const requestVersionRef = useRef(0)

  useEffect(() => {
    requestVersionRef.current += 1
    const requestVersion = requestVersionRef.current

    if (!file || file.binary || file.content === undefined) {
      setState({
        tokenLines: null,
        status: 'idle',
        message: undefined,
      })
      return
    }

    if (!language) {
      setState({
        tokenLines: null,
        status: 'skipped',
        message: undefined,
      })
      return
    }

    if (shouldSkipHighlighting(file.size, lines.length, resolvedPolicy)) {
      setState({
        tokenLines: null,
        status: 'skipped',
        message: 'Plain text mode for large file',
      })
      return
    }

    const cacheKey: HighlightTokenCacheKey = {
      fileHash: file.hash,
      language,
      theme,
    }
    const cachedTokenLines = resolvedCache.getTokenLines(cacheKey)

    if (cachedTokenLines) {
      setState({
        tokenLines: cachedTokenLines,
        status: 'done',
        message: undefined,
      })
      return
    }

    setState({
      tokenLines: null,
      status: 'running',
      message: undefined,
    })

    let cancelled = false
    const cancelScheduledTask = resolvedScheduler(() => {
      void resolvedHighlighter({
        content: file.content,
        language,
        theme,
      })
        .then((tokenLines) => {
          if (cancelled || requestVersionRef.current !== requestVersion) {
            return
          }

          resolvedCache.setTokenLines(cacheKey, tokenLines)
          setState({
            tokenLines,
            status: 'done',
            message: undefined,
          })
        })
        .catch(() => {
          if (cancelled || requestVersionRef.current !== requestVersion) {
            return
          }

          setState({
            tokenLines: null,
            status: 'failed',
            message: 'Syntax highlighting unavailable. Showing plain text.',
          })
        })
    }, resolvedPolicy.idleTimeoutMs)

    return () => {
      cancelled = true
      cancelScheduledTask()
    }
  }, [
    file,
    language,
    lines.length,
    resolvedCache,
    resolvedHighlighter,
    resolvedPolicy,
    resolvedScheduler,
    theme,
  ])

  return {
    lines,
    tokenLines: state.tokenLines,
    status: state.status,
    message: state.message,
    language,
  }
}

export function shouldSkipHighlighting(
  fileSize: number,
  lineCount: number,
  policy: HighlightPolicy,
): boolean {
  return fileSize > policy.maxBytesForHighlight || lineCount > policy.maxLinesForHighlight
}
