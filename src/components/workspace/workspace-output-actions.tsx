import { Check, Copy, Download, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import type { ProjectConfig } from '@/lib/project-config'
import type { ShareConfigSnapshot } from '@/lib/share-config'
import {
  downloadInitializrProject,
  type DownloadInitializrProjectInput,
  type DownloadInitializrProjectResponse,
} from '@/server/functions/download-initializr-project'

type WorkspaceOutputActionsProps = {
  config: ProjectConfig
  selectedDependencyIds: string[]
  createShareUrl: (snapshot: ShareConfigSnapshot) => string
}

type FeedbackState =
  | {
      tone: 'success' | 'error'
      message: string
    }
  | null

export function WorkspaceOutputActions({
  config,
  selectedDependencyIds,
  createShareUrl,
}: WorkspaceOutputActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const shareUrl = useMemo(
    () => createShareUrl({ config, selectedDependencyIds }),
    [config, createShareUrl, selectedDependencyIds],
  )

  const handleDownload = useCallback(async () => {
    if (isDownloading) {
      return
    }

    setIsDownloading(true)
    setFeedback(null)

    try {
      const response = await invokeDownloadProject({
        data: {
          config,
          selectedDependencyIds,
        },
      })

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          message: response.error.message,
        })
        return
      }

      triggerArchiveDownload(response)

      setFeedback({
        tone: 'success',
        message: `Download started for ${response.archive.filename}.`,
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to start project download right now. Please try again.',
      })
    } finally {
      setIsDownloading(false)
    }
  }, [config, isDownloading, selectedDependencyIds])

  const handleCopyShareLink = useCallback(async () => {
    if (isCopying || !shareUrl) {
      return
    }

    setIsCopying(true)
    setFeedback(null)

    try {
      await copyToClipboard(shareUrl)
      setFeedback({
        tone: 'success',
        message: 'Share link copied to clipboard.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Clipboard copy failed. You can still copy from your address bar.',
      })
    } finally {
      setIsCopying(false)
    }
  }, [isCopying, shareUrl])

  return (
    <section className="rounded-xl border bg-[var(--card)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Output Actions</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Download your generated ZIP or share this exact configuration.
          </p>
        </div>

        <span className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Phase 5
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || isCopying}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-200"
        >
          {isDownloading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isDownloading ? 'Preparing ZIP...' : 'Download ZIP'}
        </button>

        <button
          type="button"
          onClick={handleCopyShareLink}
          disabled={isDownloading || isCopying || !shareUrl}
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-[var(--foreground)] transition hover:border-emerald-500/40 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-emerald-300"
        >
          {isCopying ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCopying ? 'Copying...' : 'Copy Share Link'}
        </button>
      </div>

      {feedback ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${feedback.tone === 'success' ? 'border-emerald-300/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'}`}
        >
          {feedback.tone === 'success' ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <p>{feedback.message}</p>
        </div>
      ) : null}
    </section>
  )
}

const invokeDownloadProject = downloadInitializrProject as unknown as (payload: {
  data: DownloadInitializrProjectInput
}) => Promise<DownloadInitializrProjectResponse>

function triggerArchiveDownload(response: DownloadInitializrProjectResponse & { ok: true }) {
  const archiveBuffer = decodeBase64ToBuffer(response.archive.base64)
  const blob = new Blob([archiveBuffer], {
    type: response.archive.contentType || 'application/zip',
  })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = response.archive.filename || 'project.zip'
  anchor.rel = 'noopener'
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}

function decodeBase64ToBuffer(value: string): ArrayBuffer {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function copyToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', 'true')
  input.style.position = 'absolute'
  input.style.left = '-9999px'
  document.body.append(input)
  input.select()

  const success = document.execCommand('copy')
  document.body.removeChild(input)

  if (!success) {
    throw new Error('clipboard copy not available')
  }
}
