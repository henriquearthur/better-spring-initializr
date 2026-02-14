import { Check, Github, LoaderCircle, LogOut, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  completeGitHubOAuth,
  disconnectGitHubOAuth,
  getGitHubOAuthSession,
  startGitHubOAuth,
  type CompleteGitHubOAuthResponse,
  type DisconnectGitHubOAuthResponse,
  type GitHubOAuthSessionSummary,
  type GetGitHubOAuthSessionResponse,
  type StartGitHubOAuthResponse,
} from '@/server/functions/github-oauth'

type PanelFeedback =
  | {
      tone: 'success' | 'error'
      message: string
    }
  | null

export function GitHubAuthPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [feedback, setFeedback] = useState<PanelFeedback>(null)
  const [session, setSession] = useState<GitHubOAuthSessionSummary | null>(null)

  const isConnected = session?.connected === true
  const organizationCount = session?.organizations?.length ?? 0
  const organizationLabel = `${organizationCount} org${organizationCount === 1 ? '' : 's'}`

  const refreshSession = useCallback(async () => {
    const response = await invokeGetGitHubOAuthSession()

    if (!response.ok) {
      setSession({ connected: false })
      setFeedback({
        tone: 'error',
        message: response.error.message,
      })
      return
    }

    setSession(response.session)
  }, [])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const onCallbackPath = window.location.pathname === '/api/github/oauth/callback'
        const hasCallbackPayload =
          onCallbackPath &&
          (params.has('code') || params.has('state') || params.has('error'))

        if (hasCallbackPayload) {
          const completionResponse = await invokeCompleteGitHubOAuth({
            data: {
              code: params.get('code') ?? undefined,
              state: params.get('state') ?? undefined,
              error: params.get('error') ?? undefined,
            },
          })

          if (completionResponse.ok) {
            setFeedback({
              tone: 'success',
              message: 'GitHub account connected. You are ready for repository push in Phase 6.',
            })
          } else {
            setFeedback({
              tone: 'error',
              message: completionResponse.error.message,
            })
          }

          window.history.replaceState({}, '', '/')
        }

        if (!isMounted) {
          return
        }

        await refreshSession()
      } catch {
        if (!isMounted) {
          return
        }

        setFeedback({
          tone: 'error',
          message: 'Unable to initialize GitHub authentication status right now.',
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [refreshSession])

  const handleConnect = useCallback(async () => {
    if (isConnecting || isDisconnecting) {
      return
    }

    setIsConnecting(true)
    setFeedback(null)

    try {
      const response = await invokeStartGitHubOAuth()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          message: response.error.message,
        })
        return
      }

      window.location.assign(response.authorizationUrl)
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to start GitHub authorization right now. Please try again.',
      })
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isDisconnecting])

  const handleDisconnect = useCallback(async () => {
    if (isDisconnecting || isConnecting) {
      return
    }

    setIsDisconnecting(true)
    setFeedback(null)

    try {
      const response = await invokeDisconnectGitHubOAuth()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          message: response.error.message,
        })
        return
      }

      setSession(response.session)
      setFeedback({
        tone: 'success',
        message: 'GitHub connection removed. OAuth session cookie has been cleared.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to disconnect GitHub right now. Please try again.',
      })
    } finally {
      setIsDisconnecting(false)
    }
  }, [isConnecting, isDisconnecting])

  const connectionBadge = useMemo(() => {
    if (!isConnected || !session?.user) {
      return (
        <span className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Not connected
        </span>
      )
    }

    return (
      <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
        {session.user.login} · {organizationLabel}
      </span>
    )
  }, [isConnected, organizationLabel, session?.user])

  return (
    <section className="rounded-xl border bg-[var(--card)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">GitHub Authentication</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Connect GitHub so the upcoming push flow can create and populate repositories.
          </p>
        </div>
        {connectionBadge}
      </div>

      <div className="mt-3 rounded-lg border border-sky-300/60 bg-sky-50/70 px-3 py-2 text-xs text-sky-900 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100">
        <p className="font-medium">Why these permissions?</p>
        <p className="mt-1">
          We request <span className="font-mono">repo</span> to create/push a new repository and{' '}
          <span className="font-mono">read:org</span> to let you pick a personal or organization owner.
          OAuth tokens stay in secure httpOnly server cookies and are never exposed to client JavaScript.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isLoading || isConnecting || isDisconnecting}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-sky-400/40 bg-sky-500/10 px-3 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-200"
        >
          {isConnecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          {isConnecting ? 'Redirecting...' : isConnected ? 'Reconnect GitHub' : 'Connect GitHub'}
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isLoading || !isConnected || isConnecting || isDisconnecting}
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-[var(--foreground)] transition hover:border-rose-500/40 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-300"
        >
          {isDisconnecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
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

      <div className="mt-3 rounded-lg border border-emerald-300/60 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security posture
        </p>
        <p className="mt-1">
          Session cookie is httpOnly, SameSite=Lax, and secure in production. Token stays server-side for
          BFF GitHub API calls.
        </p>
      </div>
    </section>
  )
}

const invokeStartGitHubOAuth = startGitHubOAuth as unknown as () => Promise<StartGitHubOAuthResponse>

const invokeCompleteGitHubOAuth = completeGitHubOAuth as unknown as (payload: {
  data: { code?: string; state?: string; error?: string }
}) => Promise<CompleteGitHubOAuthResponse>

const invokeGetGitHubOAuthSession =
  getGitHubOAuthSession as unknown as () => Promise<GetGitHubOAuthSessionResponse>

const invokeDisconnectGitHubOAuth =
  disconnectGitHubOAuth as unknown as () => Promise<DisconnectGitHubOAuthResponse>
