import { Check, Copy, Download, Github, LoaderCircle, Rocket, TriangleAlert } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import type { AgentsMdPreferences, AiExtraId, AiExtrasTarget } from '@/features/ai-extras/model/ai-extras'
import type { ProjectConfig } from '@/shared/lib/project-config'
import type { ShareConfigSnapshot } from '@/features/share/model/share-config'
import {
  downloadInitializrProject,
  type DownloadInitializrProjectInput,
  type DownloadInitializrProjectResponse,
} from '@/server/features/initializr/functions/download-initializr-project'

type WorkspaceFinalizePanelProps = {
  config: ProjectConfig
  selectedDependencyIds: string[]
  selectedAiExtraIds: AiExtraId[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
  createShareUrl: (snapshot: ShareConfigSnapshot) => string
  onPublish?: () => void
}

type FeedbackState =
  | {
      tone: 'success' | 'error'
      message: string
    }
  | null

export function WorkspaceFinalizePanel({
  config,
  selectedDependencyIds,
  selectedAiExtraIds,
  agentsMdPreferences,
  aiExtrasTarget,
  createShareUrl,
  onPublish,
}: WorkspaceFinalizePanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const shareUrl = useMemo(
    () =>
      createShareUrl({
        config,
        selectedDependencyIds,
        selectedAiExtraIds,
        agentsMdPreferences,
        aiExtrasTarget,
      }),
    [
      agentsMdPreferences,
      aiExtrasTarget,
      config,
      createShareUrl,
      selectedAiExtraIds,
      selectedDependencyIds,
    ],
  )

  const isBusy = isDownloading || isCopying
  const projectCoordinates = `${config.group}.${config.artifact}`
  const stackLabel = `${config.language.toUpperCase()} / ${getBuildToolLabel(config.buildTool)}`

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
          selectedAiExtraIds,
          agentsMdPreferences,
          aiExtrasTarget,
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
  }, [
    agentsMdPreferences,
    aiExtrasTarget,
    config,
    isDownloading,
    selectedAiExtraIds,
    selectedDependencyIds,
  ])

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
    <section className="finalize-panel finalize-panel-enter" data-testid="workspace-finalize-panel">
      <div className="finalize-panel-glow" />
      <div className="finalize-panel-glow-secondary" />

      <div className="finalize-panel-header">
        <div className="space-y-2">
          <p className="finalize-panel-badge">Finalize & Share</p>
          <p className="text-sm font-semibold">Ship your project in one final step</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {projectCoordinates} <span className="mx-1">|</span> {stackLabel}
          </p>
        </div>
      </div>

      <div className="finalize-action-grid">
        {onPublish ? (
          <article className="finalize-action-card finalize-action-card-primary md:col-span-2">
            <div className="space-y-1">
              <p className="finalize-action-eyebrow">
                <Rocket className="h-3.5 w-3.5" />
                Recommended next step
              </p>
              <p className="text-sm font-semibold">Publish to GitHub</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Create a repository and push the generated project with one guided flow.
              </p>
            </div>
            <button
              type="button"
              onClick={onPublish}
              disabled={isBusy}
              className="btn btn-primary mt-3 w-full justify-center md:w-auto"
            >
              <Github className="h-4 w-4" />
              Publish to GitHub
            </button>
          </article>
        ) : null}

        <article className="finalize-action-card">
          <div className="space-y-1">
            <p className="finalize-action-eyebrow">
              <Download className="h-3.5 w-3.5" />
              Local artifact
            </p>
            <p className="text-sm font-semibold">Download ZIP</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Export the generated project archive and open it locally.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isBusy}
            className="btn btn-secondary mt-3 w-full justify-center"
          >
            {isDownloading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Preparing ZIP...' : 'Download ZIP'}
          </button>
        </article>

        <article className="finalize-action-card">
          <div className="space-y-1">
            <p className="finalize-action-eyebrow">
              <Copy className="h-3.5 w-3.5" />
              Share setup
            </p>
            <p className="text-sm font-semibold">Copy Share Link</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Capture this exact configuration and share it with your team.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyShareLink}
            disabled={isBusy || !shareUrl}
            className="btn btn-secondary mt-3 w-full justify-center"
          >
            {isCopying ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {isCopying ? 'Copying...' : 'Copy Share Link'}
          </button>
        </article>
      </div>

      {feedback ? (
        <div
          aria-live="polite"
          className={`finalize-feedback ${feedback.tone === 'success' ? 'finalize-feedback-success' : 'finalize-feedback-error'}`}
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

export function getBuildToolLabel(buildTool: ProjectConfig['buildTool']): string {
  if (buildTool === 'maven-project') {
    return 'Maven'
  }

  return 'Gradle'
}

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
