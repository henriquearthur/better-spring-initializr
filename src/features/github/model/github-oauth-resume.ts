import {
  encodeShareConfig,
  type ShareConfigSnapshot,
} from '@/features/share/model/share-config'

export const GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY =
  'github_oauth_resume_share_token'

export function cacheGitHubOAuthResumeSnapshot(snapshot: ShareConfigSnapshot): void {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  try {
    const shareToken = encodeShareConfig(snapshot)
    sessionStorage.setItem(GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY, shareToken)
  } catch {
    // Ignore storage failures to avoid blocking OAuth redirects.
  }
}

export function consumeGitHubOAuthResumeShareToken(): string | null {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return null
  }

  let shareToken: string | null = null

  try {
    shareToken = sessionStorage.getItem(GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY)
  } catch {
    return null
  } finally {
    try {
      sessionStorage.removeItem(GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY)
    } catch {
      // Ignore storage failures when cleaning up one-time resume token.
    }
  }

  if (typeof shareToken !== 'string') {
    return null
  }

  const normalizedShareToken = shareToken.trim()
  return normalizedShareToken.length > 0 ? normalizedShareToken : null
}

export function buildGitHubOAuthWorkspaceRedirectPath(
  status: 'connected' | 'error',
  shareToken?: string | null,
): string {
  const params = new URLSearchParams()
  const normalizedShareToken = typeof shareToken === 'string' ? shareToken.trim() : ''

  if (normalizedShareToken.length > 0) {
    params.set('share', normalizedShareToken)
  }

  params.set('github', status)

  return `/?${params.toString()}`
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}
