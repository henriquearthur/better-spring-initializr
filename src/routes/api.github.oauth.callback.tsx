import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  buildGitHubOAuthWorkspaceRedirectPath,
  consumeGitHubOAuthResumeShareToken,
} from '@/features/github/model/github-oauth-resume'
import {
  completeGitHubOAuth,
  type CompleteGitHubOAuthResponse,
} from '@/server/features/github/functions/github-oauth'

export const Route = createFileRoute('/api/github/oauth/callback')({
  component: GitHubOAuthCallbackRoute,
})

const invokeCompleteGitHubOAuth = completeGitHubOAuth as unknown as (payload: {
  data: { code?: string; state?: string; error?: string }
}) => Promise<CompleteGitHubOAuthResponse>

function GitHubOAuthCallbackRoute() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)

      try {
        const response = await invokeCompleteGitHubOAuth({
          data: {
            code: params.get('code') ?? undefined,
            state: params.get('state') ?? undefined,
            error: params.get('error') ?? undefined,
          },
        })

        if (!mounted) return

        if (response.ok) {
          const shareToken = consumeGitHubOAuthResumeShareToken()
          const redirectPath = buildGitHubOAuthWorkspaceRedirectPath(
            'connected',
            shareToken,
          )

          window.location.assign(redirectPath)
        } else {
          setError(response.error.message)
          setTimeout(() => {
            if (!mounted) {
              return
            }

            const shareToken = consumeGitHubOAuthResumeShareToken()
            const redirectPath = buildGitHubOAuthWorkspaceRedirectPath(
              'error',
              shareToken,
            )

            window.location.assign(redirectPath)
          }, 2000)
        }
      } catch {
        if (!mounted) return
        setError('Unable to complete GitHub authorization.')
        setTimeout(() => {
          if (!mounted) {
            return
          }

          const shareToken = consumeGitHubOAuthResumeShareToken()
          const redirectPath = buildGitHubOAuthWorkspaceRedirectPath(
            'error',
            shareToken,
          )

          window.location.assign(redirectPath)
        }, 2000)
      }
    }

    void handleCallback()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="text-center">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">Completing GitHub authorization...</p>
        )}
      </div>
    </div>
  )
}
