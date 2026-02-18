import { clearSession, getSession, useSession } from '@tanstack/react-start/server'

import type { GitHubOAuthIdentity, GitHubOAuthToken } from './github-oauth-client'
import { requireEnvironmentVariableMinLength } from '@/server/shared/config'

const GITHUB_OAUTH_STATE_COOKIE_NAME = 'github_oauth_state'
const GITHUB_OAUTH_SESSION_COOKIE_NAME = 'github_oauth_session'

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60
const OAUTH_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

type GitHubStateSessionData = {
  state?: string
  codeVerifier?: string
  createdAt?: number
}

type GitHubAccessSessionData = {
  accessToken?: string
  tokenType?: string
  scope?: string
  connectedAt?: string
  user?: {
    id?: number
    login?: string
    name?: string | null
    avatarUrl?: string | null
  }
  organizations?: Array<{
    id?: number
    login?: string
    role?: string
  }>
}

export type GitHubOAuthSession = {
  connectedAt: string
  token: {
    accessToken: string
    tokenType: string
    scope: string
  }
  user: {
    id: number
    login: string
    name: string | null
    avatarUrl: string | null
  }
  organizations: Array<{
    id: number
    login: string
    role: string
  }>
}

export class GitHubOAuthSessionError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'CONFIGURATION_ERROR'
      | 'STATE_MISSING'
      | 'STATE_MISMATCH'
      | 'STATE_EXPIRED'
      | 'SESSION_INVALID',
  ) {
    super(message)
    this.name = 'GitHubOAuthSessionError'
  }
}

export function buildGitHubCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export function verifyOAuthState(input: {
  expectedState: string | undefined
  providedState: string
  createdAt: number | undefined
  now: number
  ttlMs: number
}) {
  if (!input.expectedState || !input.createdAt) {
    throw new GitHubOAuthSessionError(
      'Missing OAuth state context for this callback request.',
      'STATE_MISSING',
    )
  }

  if (input.expectedState !== input.providedState) {
    throw new GitHubOAuthSessionError('OAuth state validation failed.', 'STATE_MISMATCH')
  }

  if (input.now - input.createdAt > input.ttlMs) {
    throw new GitHubOAuthSessionError('OAuth state verification expired.', 'STATE_EXPIRED')
  }
}

export async function setGitHubOAuthStateCookie(input: {
  state: string
  codeVerifier: string
}) {
  const session = await useSession<GitHubStateSessionData>({
    name: GITHUB_OAUTH_STATE_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    cookie: buildGitHubCookieOptions(OAUTH_STATE_MAX_AGE_SECONDS),
  })

  await session.update({
    state: input.state,
    codeVerifier: input.codeVerifier,
    createdAt: Date.now(),
  })
}

export async function consumeGitHubOAuthStateCookie(input: {
  state: string
}): Promise<{ codeVerifier: string }> {
  const session = await getSession<GitHubStateSessionData>({
    name: GITHUB_OAUTH_STATE_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    cookie: buildGitHubCookieOptions(OAUTH_STATE_MAX_AGE_SECONDS),
  })

  const payload = session.data

  verifyOAuthState({
    expectedState: payload.state,
    providedState: input.state,
    createdAt: payload.createdAt,
    now: Date.now(),
    ttlMs: OAUTH_STATE_MAX_AGE_SECONDS * 1000,
  })

  await clearSession({
    name: GITHUB_OAUTH_STATE_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    cookie: buildGitHubCookieOptions(OAUTH_STATE_MAX_AGE_SECONDS),
  })

  if (!payload.codeVerifier) {
    throw new GitHubOAuthSessionError('OAuth state code verifier missing.', 'STATE_MISSING')
  }

  return { codeVerifier: payload.codeVerifier }
}

export async function setGitHubSessionCookie(input: {
  token: GitHubOAuthToken
  identity: GitHubOAuthIdentity
}) {
  const session = await useSession<GitHubAccessSessionData>({
    name: GITHUB_OAUTH_SESSION_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    maxAge: OAUTH_SESSION_MAX_AGE_SECONDS,
    cookie: buildGitHubCookieOptions(OAUTH_SESSION_MAX_AGE_SECONDS),
  })

  await session.update({
    accessToken: input.token.accessToken,
    tokenType: input.token.tokenType,
    scope: input.token.scope,
    connectedAt: new Date().toISOString(),
    user: input.identity.user,
    organizations: input.identity.organizations,
  })
}

export async function getGitHubSessionCookie(): Promise<GitHubOAuthSession | null> {
  const session = await getSession<GitHubAccessSessionData>({
    name: GITHUB_OAUTH_SESSION_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    maxAge: OAUTH_SESSION_MAX_AGE_SECONDS,
    cookie: buildGitHubCookieOptions(OAUTH_SESSION_MAX_AGE_SECONDS),
  })

  const payload = session.data

  if (
    typeof payload.accessToken !== 'string' ||
    typeof payload.tokenType !== 'string' ||
    typeof payload.scope !== 'string' ||
    typeof payload.connectedAt !== 'string' ||
    typeof payload.user?.id !== 'number' ||
    typeof payload.user?.login !== 'string'
  ) {
    return null
  }

  return {
    connectedAt: payload.connectedAt,
    token: {
      accessToken: payload.accessToken,
      tokenType: payload.tokenType,
      scope: payload.scope,
    },
    user: {
      id: payload.user.id,
      login: payload.user.login,
      name: payload.user.name ?? null,
      avatarUrl: payload.user.avatarUrl ?? null,
    },
    organizations: (payload.organizations ?? [])
      .filter(
        (organization): organization is { id: number; login: string; role: string } =>
          typeof organization?.id === 'number' &&
          typeof organization?.login === 'string' &&
          typeof organization?.role === 'string',
      )
      .sort((left, right) => left.login.localeCompare(right.login)),
  }
}

export async function clearGitHubSessionCookie() {
  await clearSession({
    name: GITHUB_OAUTH_SESSION_COOKIE_NAME,
    password: getGitHubSessionSecret(),
    cookie: buildGitHubCookieOptions(OAUTH_SESSION_MAX_AGE_SECONDS),
  })
}

function getGitHubSessionSecret() {
  try {
    return requireEnvironmentVariableMinLength('GITHUB_SESSION_SECRET', 32)
  } catch {
    throw new GitHubOAuthSessionError(
      'GITHUB_SESSION_SECRET must be set with at least 32 characters.',
      'CONFIGURATION_ERROR',
    )
  }
}
