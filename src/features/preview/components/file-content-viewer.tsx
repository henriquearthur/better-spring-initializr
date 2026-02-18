import { useVirtualizer } from '@tanstack/react-virtual'
import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ThemedToken } from 'shiki'

import {
  useCodePreviewEngine,
  type CodePreviewEngineResult,
} from '@/features/preview/hooks/use-code-preview-engine'
import type { PreviewFileDiff, PreviewRemovedLine } from '@/features/preview/model/preview-diff'
import { formatCodePreviewLanguageLabel } from '@/features/preview/model/code-preview-language'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'

const VIEWER_ROW_HEIGHT = 26
const VIEWER_OVERSCAN = 18

type FileContentViewerProps = {
  file: PreviewSnapshotFile | null
  isLoading: boolean
  diff: PreviewFileDiff | null
  onRetry?: () => void
}

type ViewerLine =
  | {
      id: string
      kind: 'removed'
      line: PreviewRemovedLine
    }
  | {
      id: string
      kind: 'current'
      lineNumber: number
      added: boolean
      plainText: string
      tokens: ThemedToken[] | null
    }

export function FileContentViewer({ file, isLoading, diff, onRetry }: FileContentViewerProps) {
  const isDarkMode = useIsDarkMode()
  const preview = useCodePreviewEngine({
    file,
    isDarkMode,
  })

  if (isLoading) {
    return <ViewerState message="Generating latest preview snapshot..." tone="muted" />
  }

  if (!file) {
    return <ViewerState message="Select a file from the tree to inspect its contents." tone="muted" />
  }

  if (file.binary || file.content === undefined) {
    return <ViewerState message="This file is binary or unreadable in text mode." tone="warning" />
  }

  return (
    <ContentPanel
      file={file}
      diff={diff}
      preview={preview}
      onRetry={onRetry}
    />
  )
}

type ContentPanelProps = {
  file: PreviewSnapshotFile
  diff: PreviewFileDiff | null
  preview: CodePreviewEngineResult
  onRetry?: () => void
}

function ContentPanel({ file, diff, preview, onRetry }: ContentPanelProps) {
  const viewerLines = buildViewerLines({
    plainTextLines: preview.lines,
    tokenLines: preview.tokenLines,
    diff,
  })

  const languageLabel = formatCodePreviewLanguageLabel(preview.language)
  const footerTone = preview.status === 'failed' ? 'warning' : 'muted'
  const showStatusPill = preview.status === 'running'

  return (
    <article className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border bg-[var(--card)]">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
        <p className="truncate font-mono text-[var(--foreground)]" title={file.path}>
          {file.path}
        </p>

        <div className="flex items-center gap-2">
          {showStatusPill ? (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              data-testid="preview-highlighting-pill"
            >
              Highlighting...
            </span>
          ) : null}

          <span className="rounded-md border px-2 py-0.5 uppercase tracking-[0.08em] text-[10px] text-[var(--muted-foreground)]">
            {languageLabel}
          </span>
        </div>
      </header>

      <VirtualizedCodeView viewerLines={viewerLines} />

      {preview.message ? (
        <footer
          className={`border-t px-3 py-2 text-xs ${
            footerTone === 'warning'
              ? 'bg-amber-100 text-amber-950 dark:bg-amber-400/10 dark:text-amber-100'
              : 'bg-[var(--muted)]/60 text-[var(--muted-foreground)]'
          }`}
        >
          {preview.message}
        </footer>
      ) : null}

      {preview.status === 'failed' && onRetry ? (
        <div className="border-t px-3 py-2">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : null}
    </article>
  )
}

function VirtualizedCodeView({ viewerLines }: { viewerLines: ViewerLine[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const rowVirtualizer = useVirtualizer({
    count: viewerLines.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => VIEWER_ROW_HEIGHT,
    overscan: VIEWER_OVERSCAN,
  })

  return (
    <div
      ref={scrollRef}
      data-testid="preview-code-pane"
      className="preview-code-pane relative min-h-0 flex-1 overflow-auto isolate"
    >
      <div
        aria-hidden="true"
        data-testid="preview-gutter-mask"
        className="pointer-events-none absolute inset-y-3 left-3 z-20 w-[4.5rem] border-r bg-[var(--card)]"
      />
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          minWidth: '100%',
          position: 'relative',
          width: 'max-content',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const line = viewerLines[virtualRow.index]

          if (!line) {
            return null
          }

          return (
            <div
              key={line.id}
              className="absolute inset-x-0"
              style={{
                height: `${virtualRow.size}px`,
                top: `${virtualRow.start}px`,
              }}
            >
              {line.kind === 'removed' ? (
                <RemovedLineRow line={line.line} />
              ) : (
                <CurrentLineRow
                  lineNumber={line.lineNumber}
                  added={line.added}
                  plainText={line.plainText}
                  tokens={line.tokens}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RemovedLineRow({ line }: { line: PreviewRemovedLine }) {
  return (
    <div className="grid h-[26px] min-w-full grid-cols-[4.5rem_minmax(0,1fr)] items-center bg-red-500/10 font-mono text-sm leading-6 [tab-size:2]">
      <span className="sticky left-0 z-30 h-full border-r bg-[var(--card)] px-2 text-right text-xs text-red-700 dark:text-red-300">
        -{line.lineNumber}
      </span>
      <span className="relative z-0 overflow-hidden whitespace-pre px-4 text-red-800 dark:text-red-100">
        {line.content || ' '}
      </span>
    </div>
  )
}

type CurrentLineRowProps = {
  lineNumber: number
  added: boolean
  plainText: string
  tokens: ThemedToken[] | null
}

function CurrentLineRow({ lineNumber, added, plainText, tokens }: CurrentLineRowProps) {
  return (
    <div
      className={`grid h-[26px] min-w-full grid-cols-[4.5rem_minmax(0,1fr)] items-center font-mono text-sm leading-6 [tab-size:2] ${
        added ? 'bg-emerald-500/10' : ''
      }`}
    >
      <span
        className={`sticky left-0 z-30 h-full border-r bg-[var(--card)] px-2 text-right text-xs ${
          added
            ? 'text-emerald-900 dark:text-emerald-300'
            : 'text-[var(--muted-foreground)]'
        }`}
      >
        {added ? '+' : ''}
        {lineNumber}
      </span>
      <span className="relative z-0 overflow-hidden whitespace-pre px-4">
        {tokens && tokens.length > 0 ? (
          tokens.map((token, tokenIndex) => (
            <span
              key={`${lineNumber}-${token.offset}-${tokenIndex}`}
              style={{
                backgroundColor: token.bgColor,
                color: token.color,
                fontStyle: token.fontStyle !== undefined && token.fontStyle & 1 ? 'italic' : undefined,
                fontWeight: token.fontStyle !== undefined && token.fontStyle & 2 ? '700' : undefined,
                textDecoration:
                  token.fontStyle !== undefined && token.fontStyle & 4 ? 'underline' : undefined,
              }}
            >
              {token.content}
            </span>
          ))
        ) : plainText.length > 0 ? (
          <span>{plainText}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </span>
    </div>
  )
}

function buildViewerLines({
  plainTextLines,
  tokenLines,
  diff,
}: {
  plainTextLines: string[]
  tokenLines: ThemedToken[][] | null
  diff: PreviewFileDiff | null
}): ViewerLine[] {
  const lineDiff = diff?.lineDiff
  const currentLineCount = Math.max(plainTextLines.length, tokenLines?.length ?? 0)

  if (!lineDiff) {
    return Array.from({ length: currentLineCount }, (_, index) => ({
      id: `line-${index + 1}`,
      kind: 'current',
      lineNumber: index + 1,
      added: false,
      plainText: plainTextLines[index] ?? '',
      tokens: tokenLines?.[index] ?? null,
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

  for (let lineNumber = 1; lineNumber <= currentLineCount; lineNumber += 1) {
    const removedBeforeLine = removedByAfterLine.get(lineNumber - 1)

    if (removedBeforeLine) {
      for (const [index, removedLine] of removedBeforeLine.entries()) {
        output.push({
          id: `removed-${removedLine.afterLine}-${removedLine.lineNumber}-${index}`,
          kind: 'removed',
          line: removedLine,
        })
      }
    }

    output.push({
      id: `line-${lineNumber}`,
      kind: 'current',
      lineNumber,
      added: addedSet.has(lineNumber),
      plainText: plainTextLines[lineNumber - 1] ?? '',
      tokens: tokenLines?.[lineNumber - 1] ?? null,
    })
  }

  const removedAtEnd = removedByAfterLine.get(currentLineCount)

  if (removedAtEnd) {
    for (const [index, removedLine] of removedAtEnd.entries()) {
      output.push({
        id: `removed-${removedLine.afterLine}-${removedLine.lineNumber}-${index}`,
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
      ? 'border-amber-400/80 bg-amber-100 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100'
      : tone === 'error'
        ? 'border-red-400/80 bg-red-100 text-red-950 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'
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
          className="btn btn-secondary btn-sm"
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
