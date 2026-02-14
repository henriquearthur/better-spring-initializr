import { codeToHtml } from 'shiki'
import { useEffect, useMemo, useState } from 'react'

import type { PreviewSnapshotFile } from '@/lib/preview-tree'

const SHIKI_LIGHT_THEME = 'github-light-default'
const SHIKI_DARK_THEME = 'github-dark-default'

type FileContentViewerProps = {
  file: PreviewSnapshotFile | null
  isLoading: boolean
}

export function FileContentViewer({ file, isLoading }: FileContentViewerProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [highlightError, setHighlightError] = useState<string | null>(null)
  const isDarkMode = useIsDarkMode()

  const language = useMemo(() => inferLanguageFromPath(file?.path), [file?.path])

  useEffect(() => {
    if (!file || file.binary || file.content === undefined) {
      setHighlightedHtml('')
      setHighlightError(null)
      setIsHighlighting(false)
      return
    }

    let cancelled = false
    setIsHighlighting(true)
    setHighlightError(null)

    void codeToHtml(file.content, {
      lang: language,
      theme: isDarkMode ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME,
    })
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHighlightError('Unable to highlight this file. Showing plain text instead.')
          setHighlightedHtml('')
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

      <div className="relative flex-1 overflow-auto">
        {isHighlighting && highlightedHtml.length === 0 ? (
          <ViewerState message="Applying syntax highlighting..." tone="muted" />
        ) : highlightedHtml ? (
          <div
            className="text-sm [&_.shiki]:m-0 [&_.shiki]:min-h-full [&_.shiki]:!bg-transparent [&_.shiki]:p-4 [&_.shiki]:font-mono [&_.shiki]:leading-6"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="min-h-full overflow-auto p-4 font-mono text-sm leading-6 text-[var(--foreground)]">
            {file.content}
          </pre>
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

type ViewerStateProps = {
  message: string
  tone: 'muted' | 'warning'
}

function ViewerState({ message, tone }: ViewerStateProps) {
  const palette =
    tone === 'warning'
      ? 'border-amber-300/70 bg-amber-50/70 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100'
      : 'border-dashed text-[var(--muted-foreground)]'

  return (
    <div
      className={`flex h-full min-h-[420px] items-center justify-center rounded-xl border px-4 text-sm ${palette}`}
    >
      {message}
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
