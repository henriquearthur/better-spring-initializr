import { createServerFn } from '@tanstack/react-start'

import {
  createGitHubOAuthStart,
  exchangeCodeForToken,
  fetchAuthenticatedUser,
  GitHubOAuthClientError,
  type GitHubOAuthConfig,
} from '../lib/github-oauth-client'

export type GitHubOAuthSessionSummary = {
  connected: boolean
  user?: {
    id: number
    login: string
    name: string | null
    avatarUrl: string | null
  }
  organizations?: Array<{
    id: number
    login: string
    role: string
  }>
  connectedAt?: string
}

type GitHubOAuthErrorCode =
  | 'GITHUB_AUTH_NOT_CONFIGURED'
  | 'GITHUB_AUTH_FAILED'
  | 'GITHUB_AUTH_CANCELLED'

type GitHubOAuthError = {
  code: GitHubOAuthErrorCode
  message: string
  retryable: boolean
}

export type StartGitHubOAuthResponse =
  | {
      ok: true
      authorizationUrl: string
    }
  | {
      ok: false
      error: GitHubOAuthError
    }

export type CompleteGitHubOAuthResponse =
  | {
      ok: true
      session: GitHubOAuthSessionSummary
    }
  | {
      ok: false
      error: GitHubOAuthError
    }

export type GetGitHubOAuthSessionResponse =
  | {
      ok: true
      session: GitHubOAuthSessionSummary
    }
  | {
      ok: false
      error: GitHubOAuthError
    }

export type DisconnectGitHubOAuthResponse =
  | {
      ok: true
      session: GitHubOAuthSessionSummary
    }
  | {
      ok: false
      error: GitHubOAuthError
    }

type CompleteGitHubOAuthInput = {
  code?: string
  state?: string
  error?: string
}

export const startGitHubOAuth = createServerFn({ method: 'POST' }).handler(
  async (): Promise<StartGitHubOAuthResponse> => startGitHubOAuthFromBff(),
)

export const completeGitHubOAuth = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<CompleteGitHubOAuthResponse> =>
    completeGitHubOAuthFromBff(normalizeCompleteOAuthInput(data)),
)

export const getGitHubOAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetGitHubOAuthSessionResponse> => getGitHubOAuthSessionFromBff(),
)

export const disconnectGitHubOAuth = createServerFn({ method: 'POST' }).handler(
  async (): Promise<DisconnectGitHubOAuthResponse> => disconnectGitHubOAuthFromBff(),
)

export async function startGitHubOAuthFromBff(): Promise<StartGitHubOAuthResponse> {
  try {
    const config = getGitHubOAuthConfig()
    const oauthStart = await createGitHubOAuthStart(config)
    const oauthSession = await import('../lib/github-oauth-session.server')

    await oauthSession.setGitHubOAuthStateCookie({
      state: oauthStart.state,
      codeVerifier: oauthStart.codeVerifier,
    })

    return {
      ok: true,
      authorizationUrl: oauthStart.authorizationUrl,
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeGitHubOAuthError(error),
    }
  }
}

export async function completeGitHubOAuthFromBff(
  input: CompleteGitHubOAuthInput,
): Promise<CompleteGitHubOAuthResponse> {
  if (input.error === 'access_denied') {
    return {
      ok: false,
      error: {
        code: 'GITHUB_AUTH_CANCELLED',
        message: 'GitHub authorization was cancelled before completion.',
        retryable: false,
      },
    }
  }

  if (!input.code || !input.state) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_AUTH_FAILED',
        message: 'GitHub authorization callback did not include required state and code.',
        retryable: true,
      },
    }
  }

  try {
    const config = getGitHubOAuthConfig()
    const oauthSession = await import('../lib/github-oauth-session.server')
    const stateContext = await oauthSession.consumeGitHubOAuthStateCookie({ state: input.state })
    const token = await exchangeCodeForToken({
      config,
      code: input.code,
      codeVerifier: stateContext.codeVerifier,
    })
    const identity = await fetchAuthenticatedUser(token.accessToken)

    await oauthSession.setGitHubSessionCookie({
      token,
      identity,
    })

    return {
      ok: true,
      session: {
        connected: true,
        user: identity.user,
        organizations: identity.organizations,
        connectedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeGitHubOAuthError(error),
    }
  }
}

export async function getGitHubOAuthSessionFromBff(): Promise<GetGitHubOAuthSessionResponse> {
  try {
    const oauthSession = await import('../lib/github-oauth-session.server')
    const session = await oauthSession.getGitHubSessionCookie()

    if (!session) {
      return {
        ok: true,
        session: {
          connected: false,
        },
      }
    }

    return {
      ok: true,
      session: {
        connected: true,
        user: session.user,
        organizations: session.organizations,
        connectedAt: session.connectedAt,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeGitHubOAuthError(error),
    }
  }
}

export async function disconnectGitHubOAuthFromBff(): Promise<DisconnectGitHubOAuthResponse> {
  try {
    const oauthSession = await import('../lib/github-oauth-session.server')
    await oauthSession.clearGitHubSessionCookie()

    return {
      ok: true,
      session: {
        connected: false,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeGitHubOAuthError(error),
    }
  }
}

function sanitizeGitHubOAuthError(error: unknown): GitHubOAuthError {
  if (isGitHubSessionError(error)) {
    if (error.code === 'CONFIGURATION_ERROR') {
      return {
        code: 'GITHUB_AUTH_NOT_CONFIGURED',
        message: 'GitHub OAuth is not configured for this environment yet.',
        retryable: false,
      }
    }

    return {
      code: 'GITHUB_AUTH_FAILED',
      message: 'GitHub authorization validation failed. Please try connecting again.',
      retryable: true,
    }
  }

  if (error instanceof GitHubOAuthClientError) {
    if (error.code === 'CONFIGURATION_ERROR') {
      return {
        code: 'GITHUB_AUTH_NOT_CONFIGURED',
        message: 'GitHub OAuth is not configured for this environment yet.',
        retryable: false,
      }
    }

    if (error.code === 'ACCESS_DENIED') {
      return {
        code: 'GITHUB_AUTH_CANCELLED',
        message: 'GitHub authorization was cancelled before completion.',
        retryable: false,
      }
    }

    return {
      code: 'GITHUB_AUTH_FAILED',
      message: 'Unable to complete GitHub authorization right now. Please try again.',
      retryable: true,
    }
  }

  return {
    code: 'GITHUB_AUTH_FAILED',
    message: 'Unable to complete GitHub authorization right now. Please try again.',
    retryable: true,
  }
}

function getGitHubOAuthConfig(): GitHubOAuthConfig {
  return {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GITHUB_OAUTH_CALLBACK_URL ?? 'http://localhost:3000/api/github/oauth/callback',
  }
}

function normalizeCompleteOAuthInput(input: unknown): CompleteGitHubOAuthInput {
  if (!isObject(input)) {
    return {}
  }

  return {
    code: typeof input.code === 'string' ? input.code : undefined,
    state: typeof input.state === 'string' ? input.state : undefined,
    error: typeof input.error === 'string' ? input.error : undefined,
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isGitHubSessionError(
  error: unknown,
): error is { code: 'CONFIGURATION_ERROR' | 'STATE_MISSING' | 'STATE_MISMATCH' | 'STATE_EXPIRED' | 'SESSION_INVALID' } {
  if (!(error instanceof Error) || !('code' in error)) {
    return false
  }

  return (
    error.code === 'CONFIGURATION_ERROR' ||
    error.code === 'STATE_MISSING' ||
    error.code === 'STATE_MISMATCH' ||
    error.code === 'STATE_EXPIRED' ||
    error.code === 'SESSION_INVALID'
  )
}
