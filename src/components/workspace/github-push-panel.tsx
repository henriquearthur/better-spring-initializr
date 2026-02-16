import { Check, ExternalLink, Github, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ProjectConfig } from '@/lib/project-config'
import {
  getGitHubOAuthSession,
  type GetGitHubOAuthSessionResponse,
} from '@/server/functions/github-oauth'
import {
  pushProjectToGitHub,
  type PushProjectToGitHubInput,
  type PushProjectToGitHubResponse,
} from '@/server/functions/push-project-to-github'

type GitHubPushPanelProps = {
  config: ProjectConfig
  selectedDependencyIds: string[]
}

type PushFeedback =
  | {
      tone: 'success' | 'error'
      message: string
      repositoryUrl?: string
      fullName?: string
    }
  | null

type OwnerOption = {
  value: string
  label: string
}

const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9._-]+$/

export function GitHubPushPanel({ config, selectedDependencyIds }: GitHubPushPanelProps) {
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isPushing, setIsPushing] = useState(false)
  const [owner, setOwner] = useState('')
  const [repositoryName, setRepositoryName] = useState(config.artifact)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [feedback, setFeedback] = useState<PushFeedback>(null)
  const [connected, setConnected] = useState(false)
  const [ownerOptions, setOwnerOptions] = useState<OwnerOption[]>([])

  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      try {
        const response = await invokeGetGitHubOAuthSession()

        if (!mounted || !response.ok || !response.session.connected || !response.session.user) {
          if (mounted) {
            setConnected(false)
            setOwnerOptions([])
          }

          return
        }

        const options = [
          {
            value: response.session.user.login,
            label: `${response.session.user.login} (Personal)`,
          },
          ...(response.session.organizations ?? []).map((organization) => ({
            value: organization.login,
            label: `${organization.login} (Organization)`,
          })),
        ]

        setConnected(true)
        setOwnerOptions(options)
        setOwner((currentOwner) => currentOwner || options[0]?.value || '')
      } finally {
        if (mounted) {
          setIsLoadingSession(false)
        }
      }
    }

    void loadSession()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setRepositoryName((currentName) => (currentName.trim().length === 0 ? config.artifact : currentName))
  }, [config.artifact])

  const trimmedRepositoryName = repositoryName.trim()
  const repositoryNameError = useMemo(() => {
    if (trimmedRepositoryName.length === 0) {
      return 'Repository name is required.'
    }

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

  const handlePush = useCallback(async () => {
    if (isPushing || !connected || !owner || repositoryNameError) {
      return
    }

    setIsPushing(true)
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
        setFeedback({
          tone: 'error',
          message: response.error.message,
        })
        return
      }

      setFeedback({
        tone: 'success',
        message: `Repository ${response.fullName} created and initial commit pushed.`,
        repositoryUrl: response.repositoryUrl,
        fullName: response.fullName,
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to push to GitHub right now. Please try again.',
      })
    } finally {
      setIsPushing(false)
    }
  }, [
    config,
    connected,
    isPushing,
    owner,
    repositoryNameError,
    selectedDependencyIds,
    trimmedRepositoryName,
    visibility,
  ])

  if (isLoadingSession || !connected) {
    return null
  }

  return (
    <section className="rounded-xl border bg-[var(--card)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Push Generated Project to GitHub</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Create a repository and push the generated Spring project in one action.
          </p>
        </div>

      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--muted-foreground)]">Repository owner</span>
          <select
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            disabled={isPushing}
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
            disabled={isPushing}
            placeholder="demo-service"
            className="h-9 rounded-md border bg-[var(--background)] px-2 text-sm"
          />
          {repositoryNameError ? (
            <span className="text-[11px] text-red-600 dark:text-red-300">{repositoryNameError}</span>
          ) : null}
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVisibility('private')}
          disabled={isPushing}
          className={`h-8 rounded-md border px-3 text-xs font-medium transition ${visibility === 'private' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]'}`}
        >
          Private
        </button>
        <button
          type="button"
          onClick={() => setVisibility('public')}
          disabled={isPushing}
          className={`h-8 rounded-md border px-3 text-xs font-medium transition ${visibility === 'public' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]'}`}
        >
          Public
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePush}
          disabled={isPushing || !owner || repositoryNameError !== null}
          className="btn btn-primary"
        >
          {isPushing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          {isPushing ? 'Pushing...' : 'Push to GitHub'}
        </button>
      </div>

      {feedback ? (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${feedback.tone === 'success' ? 'border-emerald-300/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'}`}
        >
          <p className="flex items-start gap-2">
            {feedback.tone === 'success' ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </p>

          {feedback.tone === 'success' && feedback.repositoryUrl ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 pl-5">
              <a
                href={feedback.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] underline underline-offset-2"
              >
                {feedback.fullName}
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                type="button"
                onClick={() => window.open(feedback.repositoryUrl, '_blank', 'noopener,noreferrer')}
                className="btn btn-secondary h-7 px-2 text-[11px]"
              >
                Open Repo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

const invokeGetGitHubOAuthSession =
  getGitHubOAuthSession as unknown as () => Promise<GetGitHubOAuthSessionResponse>

const invokePushProjectToGitHub = pushProjectToGitHub as unknown as (payload: {
  data: PushProjectToGitHubInput
}) => Promise<PushProjectToGitHubResponse>
