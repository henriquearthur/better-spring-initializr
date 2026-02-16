import { Check, ExternalLink, Github, LoaderCircle, LogOut, TriangleAlert, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ProjectConfig } from '@/lib/project-config'
import {
  disconnectGitHubOAuth,
  getGitHubOAuthSession,
  startGitHubOAuth,
  type DisconnectGitHubOAuthResponse,
  type GetGitHubOAuthSessionResponse,
  type StartGitHubOAuthResponse,
} from '@/server/functions/github-oauth'
import {
  pushProjectToGitHub,
  type PushProjectToGitHubInput,
  type PushProjectToGitHubResponse,
} from '@/server/functions/push-project-to-github'

type GitHubPublishDialogProps = {
  open: boolean
  onClose: () => void
  config: ProjectConfig
  selectedDependencyIds: string[]
}

type DialogPhase = 'loading' | 'connect' | 'configure' | 'pushing' | 'done'

type OwnerOption = {
  value: string
  label: string
}

type DialogFeedback = {
  tone: 'success' | 'error'
  message: string
} | null

const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9._-]+$/

export function GitHubPublishDialog({
  open,
  onClose,
  config,
  selectedDependencyIds,
}: GitHubPublishDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [phase, setPhase] = useState<DialogPhase>('loading')
  const [feedback, setFeedback] = useState<DialogFeedback>(null)
  const [ownerOptions, setOwnerOptions] = useState<OwnerOption[]>([])
  const [owner, setOwner] = useState('')
  const [repositoryName, setRepositoryName] = useState(config.artifact)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [userName, setUserName] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultFullName, setResultFullName] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  useEffect(() => {
    if (!open) return

    setFeedback(null)
    setResultUrl(null)
    setResultFullName(null)
    setRepositoryName(config.artifact)
    setVisibility('private')

    let mounted = true

    const checkSession = async () => {
      setPhase('loading')

      try {
        const response = await invokeGetGitHubOAuthSession()

        if (!mounted) return

        if (response.ok && response.session.connected && response.session.user) {
          const options = [
            {
              value: response.session.user.login,
              label: `${response.session.user.login} (Personal)`,
            },
            ...(response.session.organizations ?? []).map((org) => ({
              value: org.login,
              label: `${org.login} (Organization)`,
            })),
          ]

          setOwnerOptions(options)
          setOwner(options[0]?.value ?? '')
          setUserName(response.session.user.login)
          setPhase('configure')
        } else {
          setOwnerOptions([])
          setUserName(null)
          setPhase('connect')
        }
      } catch {
        if (!mounted) return
        setPhase('connect')
      }
    }

    void checkSession()

    return () => {
      mounted = false
    }
  }, [open, config.artifact])

  const trimmedRepositoryName = repositoryName.trim()
  const repositoryNameError = useMemo(() => {
    if (trimmedRepositoryName.length === 0) return 'Repository name is required.'
    if (
      trimmedRepositoryName.length > 100 ||
      !REPOSITORY_NAME_PATTERN.test(trimmedRepositoryName) ||
      trimmedRepositoryName.startsWith('.') ||
      trimmedRepositoryName.endsWith('.')
    ) {
      return 'Use letters, numbers, dots, dashes, or underscores.'
    }
    return null
  }, [trimmedRepositoryName])

  const handleConnect = useCallback(async () => {
    setFeedback(null)

    try {
      const response = await invokeStartGitHubOAuth()

      if (!response.ok) {
        setFeedback({ tone: 'error', message: response.error.message })
        return
      }

      window.location.assign(response.authorizationUrl)
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to start GitHub authorization right now. Please try again.',
      })
    }
  }, [])

  const handleDisconnect = useCallback(async () => {
    setFeedback(null)

    try {
      const response = await invokeDisconnectGitHubOAuth()

      if (!response.ok) {
        setFeedback({ tone: 'error', message: response.error.message })
        return
      }

      setOwnerOptions([])
      setUserName(null)
      setPhase('connect')
      setFeedback({ tone: 'success', message: 'GitHub connection removed.' })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to disconnect GitHub right now. Please try again.',
      })
    }
  }, [])

  const handlePush = useCallback(async () => {
    if (repositoryNameError || !owner) return

    setPhase('pushing')
    setFeedback(null)

    try {
      const response = await invokePushProjectToGitHub({
        data: {
          config,
          selectedDependencyIds,
          owner,
          repositoryName: trimmedRepositoryName,
          visibility,
          description: config.description,
        },
      })

      if (!response.ok) {
        setFeedback({ tone: 'error', message: response.error.message })
        setPhase('configure')
        return
      }

      setResultUrl(response.repositoryUrl)
      setResultFullName(response.fullName)
      setPhase('done')
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to push to GitHub right now. Please try again.',
      })
      setPhase('configure')
    }
  }, [config, owner, repositoryNameError, selectedDependencyIds, trimmedRepositoryName, visibility])

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-2xl border bg-[var(--card)] p-0 text-[var(--foreground)] shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          <p className="text-sm font-semibold">Publish to GitHub</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        {phase === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted-foreground)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Checking GitHub connection...
          </div>
        ) : null}

        {phase === 'connect' ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect your GitHub account to create a repository and push the generated project.
            </p>

            <button
              type="button"
              onClick={handleConnect}
              className="btn btn-primary"
            >
              <Github className="h-4 w-4" />
              Connect GitHub
            </button>
          </div>
        ) : null}

        {phase === 'configure' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                Connected as <span className="font-medium text-[var(--foreground)]">{userName}</span>
              </p>
              <button
                type="button"
                onClick={handleDisconnect}
                className="btn btn-secondary h-7 gap-1.5 px-2 text-[11px] text-[var(--muted-foreground)]"
              >
                <LogOut className="h-3 w-3" />
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-[var(--muted-foreground)]">Repository owner</span>
                <select
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className="h-9 rounded-md border bg-[var(--background)] px-2 text-sm"
                >
                  {ownerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-[var(--muted-foreground)]">Repository name</span>
                <input
                  type="text"
                  value={repositoryName}
                  onChange={(event) => setRepositoryName(event.target.value)}
                  placeholder="demo-service"
                  className="h-9 rounded-md border bg-[var(--background)] px-2 text-sm"
                />
                {repositoryNameError ? (
                  <span className="text-[11px] text-red-600 dark:text-red-300">{repositoryNameError}</span>
                ) : null}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`h-8 rounded-md border px-3 text-xs font-medium transition ${visibility === 'private' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]'}`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`h-8 rounded-md border px-3 text-xs font-medium transition ${visibility === 'public' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]'}`}
              >
                Public
              </button>
            </div>

            <button
              type="button"
              onClick={handlePush}
              disabled={!owner || repositoryNameError !== null}
              className="btn btn-primary"
            >
              <Github className="h-4 w-4" />
              Push to GitHub
            </button>
          </div>
        ) : null}

        {phase === 'pushing' ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted-foreground)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Creating repository and pushing project...
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-300/70 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>Repository {resultFullName} created and initial commit pushed.</p>
            </div>

            {resultUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs underline underline-offset-2"
                >
                  {resultFullName}
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => window.open(resultUrl, '_blank', 'noopener,noreferrer')}
                  className="btn btn-primary btn-sm h-8 gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Repo
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${feedback.tone === 'success' ? 'border-emerald-300/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'}`}
          >
            {feedback.tone === 'success' ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <p>{feedback.message}</p>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}

const invokeStartGitHubOAuth = startGitHubOAuth as unknown as () => Promise<StartGitHubOAuthResponse>

const invokeGetGitHubOAuthSession =
  getGitHubOAuthSession as unknown as () => Promise<GetGitHubOAuthSessionResponse>

const invokeDisconnectGitHubOAuth =
  disconnectGitHubOAuth as unknown as () => Promise<DisconnectGitHubOAuthResponse>

const invokePushProjectToGitHub = pushProjectToGitHub as unknown as (payload: {
  data: PushProjectToGitHubInput
}) => Promise<PushProjectToGitHubResponse>
