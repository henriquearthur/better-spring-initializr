import { RotateCcw } from 'lucide-react'
import { codeToTokens, type BuiltinLanguage, type ThemedToken } from 'shiki'
import { useEffect, useMemo, useState } from 'react'

import type { PreviewFileDiff, PreviewRemovedLine } from '@/lib/preview-diff'
import type { PreviewSnapshotFile } from '@/lib/preview-tree'

const SHIKI_LIGHT_THEME = 'github-light-default'
const SHIKI_DARK_THEME = 'github-dark-default'

type FileContentViewerProps = {
  file: PreviewSnapshotFile | null
  isLoading: boolean
  diff: PreviewFileDiff | null
  onRetry?: () => void
}

type ViewerLine =
  | { kind: 'removed'; line: PreviewRemovedLine }
  | { kind: 'current'; lineNumber: number; added: boolean; tokens: ThemedToken[] }

export function FileContentViewer({ file, isLoading, diff, onRetry }: FileContentViewerProps) {
  const [tokenLines, setTokenLines] = useState<ThemedToken[][]>([])
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [highlightError, setHighlightError] = useState<string | null>(null)
  const isDarkMode = useIsDarkMode()

  const language = useMemo(() => inferLanguageFromPath(file?.path), [file?.path])

  useEffect(() => {
    if (!file || file.binary || file.content === undefined) {
      setTokenLines([])
      setHighlightError(null)
      setIsHighlighting(false)
      return
    }

    let cancelled = false
    setIsHighlighting(true)
    setHighlightError(null)

    void codeToTokens(file.content, {
      lang: language as BuiltinLanguage,
      theme: isDarkMode ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME,
    })
      .then((result) => {
        if (!cancelled) {
          setTokenLines(result.tokens)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHighlightError('Unable to highlight this file. Showing plain text instead.')
          setTokenLines([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHighlighting(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [file, isDarkMode, language])

  if (isLoading) {
    return <ViewerState message="Generating latest preview snapshot..." tone="muted" />
  }

  if (!file) {
    return <ViewerState message="Select a file from the tree to inspect its contents." tone="muted" />
  }

  if (file.binary || file.content === undefined) {
    return <ViewerState message="This file is binary or unreadable in text mode." tone="warning" />
  }

  const viewerLines = buildViewerLines(tokenLines, diff)

  return (
    <article className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border bg-[var(--card)]">
      <header className="flex items-center justify-between border-b px-3 py-2 text-xs">
        <p className="truncate font-mono text-[var(--foreground)]" title={file.path}>
          {file.path}
        </p>
        <span className="rounded-md border px-2 py-0.5 uppercase tracking-[0.08em] text-[10px] text-[var(--muted-foreground)]">
          {language}
        </span>
      </header>

      <div className="relative flex-1 overflow-auto py-2">
        {isHighlighting && tokenLines.length === 0 ? (
          <ViewerState message="Applying syntax highlighting..." tone="muted" />
        ) : (
          <table className="w-full border-separate border-spacing-0 cursor-default select-none font-mono text-sm leading-6">
            <tbody>
              {viewerLines.map((line, index) => {
                if (line.kind === 'removed') {
                  return (
                    <tr key={`removed-${line.line.lineNumber}-${index}`} className="bg-red-500/10">
                      <td className="w-12 border-r px-2 text-right text-xs text-red-700 dark:text-red-300">
                        -{line.line.lineNumber}
                      </td>
                      <td className="select-text whitespace-pre px-3 text-red-800 dark:text-red-100">{line.line.content || ' '}</td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={`line-${line.lineNumber}`}
                    className={line.added ? 'bg-emerald-500/10' : undefined}
                  >
                    <td
                      className={`w-12 border-r px-2 text-right text-xs ${
                        line.added
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {line.added ? '+' : ''}
                      {line.lineNumber}
                    </td>
                    <td className="select-text whitespace-pre px-3">
                      {line.tokens.length > 0 ? (
                        line.tokens.map((token, tokenIndex) => (
                          <span
                            key={`${line.lineNumber}-${token.offset}-${tokenIndex}`}
                            style={{
                              color: token.color,
                              backgroundColor: token.bgColor,
                              fontWeight:
                                token.fontStyle !== undefined && token.fontStyle & 2 ? '700' : undefined,
                              fontStyle:
                                token.fontStyle !== undefined && token.fontStyle & 1
                                  ? 'italic'
                                  : undefined,
                              textDecoration:
                                token.fontStyle !== undefined && token.fontStyle & 4
                                  ? 'underline'
                                  : undefined,
                            }}
                          >
                            {token.content}
                          </span>
                        ))
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {highlightError ? (
        <footer className="border-t bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
          {highlightError}
        </footer>
      ) : null}
    </article>
  )
}

function buildViewerLines(tokenLines: ThemedToken[][], diff: PreviewFileDiff | null): ViewerLine[] {
  const lineDiff = diff?.lineDiff

  if (!lineDiff) {
    return tokenLines.map((tokens, index) => ({
      kind: 'current',
      lineNumber: index + 1,
      added: false,
      tokens,
    }))
  }

  const removedByAfterLine = new Map<number, PreviewRemovedLine[]>()

  for (const removedLine of lineDiff.removed) {
    const lines = removedByAfterLine.get(removedLine.afterLine)

    if (lines) {
      lines.push(removedLine)
    } else {
      removedByAfterLine.set(removedLine.afterLine, [removedLine])
    }
  }

  const addedSet = new Set(lineDiff.added)
  const output: ViewerLine[] = []

  for (let lineNumber = 1; lineNumber <= tokenLines.length; lineNumber += 1) {
    const removedBeforeLine = removedByAfterLine.get(lineNumber - 1)

    if (removedBeforeLine) {
      for (const removedLine of removedBeforeLine) {
        output.push({
          kind: 'removed',
          line: removedLine,
        })
      }
    }

    output.push({
      kind: 'current',
      lineNumber,
      added: addedSet.has(lineNumber),
      tokens: tokenLines[lineNumber - 1] ?? [],
    })
  }

  const removedAtEnd = removedByAfterLine.get(tokenLines.length)

  if (removedAtEnd) {
    for (const removedLine of removedAtEnd) {
      output.push({
        kind: 'removed',
        line: removedLine,
      })
    }
  }

  return output
}

type ViewerStateProps = {
  message: string
  tone: 'muted' | 'warning' | 'error'
  onRetry?: () => void
}

function ViewerState({ message, tone, onRetry }: ViewerStateProps) {
  const palette =
    tone === 'warning'
      ? 'border-amber-300/70 bg-amber-50/70 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100'
      : tone === 'error'
        ? 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'
        : 'border-dashed text-[var(--muted-foreground)]'

  return (
    <div
      className={`flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border px-4 text-sm ${palette}`}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition hover:bg-[var(--muted)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  )
}

function useIsDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      setIsDarkMode(root.classList.contains('dark'))
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
    }
  }, [])

  return isDarkMode
}

function inferLanguageFromPath(path: string | undefined): string {
  if (!path) {
    return 'text'
  }

  const normalizedPath = path.toLowerCase()

  if (normalizedPath.endsWith('.xml') || normalizedPath.endsWith('.pom')) {
    return 'xml'
  }

  if (normalizedPath.endsWith('.gradle') || normalizedPath.endsWith('.kts')) {
    return 'kotlin'
  }

  if (normalizedPath.endsWith('.yaml') || normalizedPath.endsWith('.yml')) {
    return 'yaml'
  }

  if (normalizedPath.endsWith('.java')) {
    return 'java'
  }

  if (normalizedPath.endsWith('.md')) {
    return 'markdown'
  }

  if (normalizedPath.endsWith('.properties')) {
    return 'properties'
  }

  if (normalizedPath.endsWith('.json')) {
    return 'json'
  }

  if (normalizedPath.endsWith('.kt')) {
    return 'kotlin'
  }

  if (normalizedPath.endsWith('.groovy')) {
    return 'groovy'
  }

  if (normalizedPath.endsWith('.sh')) {
    return 'bash'
  }

  if (normalizedPath.endsWith('.toml')) {
    return 'toml'
  }

  if (normalizedPath.endsWith('.gitignore')) {
    return 'gitignore'
  }

  if (normalizedPath.endsWith('dockerfile')) {
    return 'dockerfile'
  }

  return 'text'
}
