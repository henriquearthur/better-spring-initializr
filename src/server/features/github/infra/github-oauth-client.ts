const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'
const GITHUB_ORG_MEMBERSHIPS_URL = 'https://api.github.com/user/memberships/orgs?state=active'

const DEFAULT_OAUTH_SCOPE = 'repo read:org'

export type GitHubOAuthConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

export type GitHubOAuthStart = {
  authorizationUrl: string
  state: string
  codeVerifier: string
}

export type GitHubOAuthToken = {
  accessToken: string
  tokenType: string
  scope: string
}

export type GitHubOAuthIdentity = {
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

type GitHubTokenResponse = {
  access_token?: unknown
  token_type?: unknown
  scope?: unknown
  error?: unknown
}

type GitHubUserResponse = {
  id?: unknown
  login?: unknown
  name?: unknown
  avatar_url?: unknown
}

type GitHubOrgMembershipResponse = {
  role?: unknown
  organization?: {
    id?: unknown
    login?: unknown
  }
}

export class GitHubOAuthClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'CONFIGURATION_ERROR'
      | 'OAUTH_EXCHANGE_FAILED'
      | 'UPSTREAM_ERROR'
      | 'INVALID_RESPONSE'
      | 'ACCESS_DENIED',
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GitHubOAuthClientError'
  }
}

export async function createGitHubOAuthStart(config: GitHubOAuthConfig): Promise<GitHubOAuthStart> {
  ensureOAuthConfig(config)

  const state = randomBase64Url(24)
  const codeVerifier = randomBase64Url(48)
  const codeChallenge = await createPkceCodeChallenge(codeVerifier)

  const authorizationUrl = buildGitHubAuthorizationUrl({
    clientId: config.clientId,
    callbackUrl: config.callbackUrl,
    state,
    codeChallenge,
  })

  return {
    authorizationUrl,
    state,
    codeVerifier,
  }
}

type BuildGitHubAuthorizationUrlInput = {
  clientId: string
  callbackUrl: string
  state: string
  codeChallenge: string
}

export function buildGitHubAuthorizationUrl(input: BuildGitHubAuthorizationUrlInput): string {
  const url = new URL(GITHUB_AUTHORIZE_URL)

  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('redirect_uri', input.callbackUrl)
  url.searchParams.set('scope', DEFAULT_OAUTH_SCOPE)
  url.searchParams.set('state', input.state)
  url.searchParams.set('code_challenge', input.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return url.toString()
}

type ExchangeCodeForTokenInput = {
  config: GitHubOAuthConfig
  code: string
  codeVerifier: string
  fetch?: typeof fetch
}

export async function exchangeCodeForToken(
  input: ExchangeCodeForTokenInput,
): Promise<GitHubOAuthToken> {
  ensureOAuthConfig(input.config)

  let response: Response

  try {
    response = await (input.fetch ?? fetch)(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: input.config.clientId,
        client_secret: input.config.clientSecret,
        code: input.code,
        redirect_uri: input.config.callbackUrl,
        code_verifier: input.codeVerifier,
      }),
    })
  } catch {
    throw new GitHubOAuthClientError(
      'Unable to reach GitHub OAuth token endpoint.',
      'UPSTREAM_ERROR',
    )
  }

  let payload: GitHubTokenResponse

  try {
    payload = (await response.json()) as GitHubTokenResponse
  } catch {
    throw new GitHubOAuthClientError(
      'GitHub OAuth token response was not valid JSON.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  if (!response.ok) {
    throw new GitHubOAuthClientError(
      'GitHub OAuth token exchange failed.',
      'OAUTH_EXCHANGE_FAILED',
      response.status,
    )
  }

  if (payload.error === 'access_denied') {
    throw new GitHubOAuthClientError('GitHub authorization was denied.', 'ACCESS_DENIED')
  }

  if (typeof payload.access_token !== 'string' || payload.access_token.length === 0) {
    throw new GitHubOAuthClientError(
      'GitHub OAuth token response was missing access token.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  return {
    accessToken: payload.access_token,
    tokenType: typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
    scope: typeof payload.scope === 'string' ? payload.scope : '',
  }
}

export async function fetchAuthenticatedUser(
  accessToken: string,
  options: { fetch?: typeof fetch } = {},
): Promise<GitHubOAuthIdentity> {
  const fetchImpl = options.fetch ?? fetch

  const userResponse = await fetchGitHubWithAuth(GITHUB_USER_URL, accessToken, fetchImpl)
  const orgMembershipResponse = await fetchGitHubWithAuth(
    GITHUB_ORG_MEMBERSHIPS_URL,
    accessToken,
    fetchImpl,
  )

  const userJson = (await userResponse.json()) as GitHubUserResponse
  const membershipsJson = (await orgMembershipResponse.json()) as unknown

  if (typeof userJson.id !== 'number' || typeof userJson.login !== 'string') {
    throw new GitHubOAuthClientError('GitHub user payload was invalid.', 'INVALID_RESPONSE')
  }

  const organizations = Array.isArray(membershipsJson)
    ? membershipsJson
        .map((membership) => normalizeOrganizationMembership(membership as GitHubOrgMembershipResponse))
        .filter((membership): membership is { id: number; login: string; role: string } =>
          membership !== null,
        )
    : []

  return {
    user: {
      id: userJson.id,
      login: userJson.login,
      name: typeof userJson.name === 'string' ? userJson.name : null,
      avatarUrl: typeof userJson.avatar_url === 'string' ? userJson.avatar_url : null,
    },
    organizations,
  }
}

async function fetchGitHubWithAuth(
  url: string,
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<Response> {
  let response: Response

  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${accessToken}`,
        'x-github-api-version': '2022-11-28',
      },
    })
  } catch {
    throw new GitHubOAuthClientError('Unable to reach GitHub API.', 'UPSTREAM_ERROR')
  }

  if (!response.ok) {
    throw new GitHubOAuthClientError('GitHub API request failed.', 'UPSTREAM_ERROR', response.status)
  }

  return response
}

async function createPkceCodeChallenge(codeVerifier: string): Promise<string> {
  const bytes = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return base64UrlEncode(new Uint8Array(digest))
}

function ensureOAuthConfig(config: GitHubOAuthConfig) {
  if (
    config.clientId.trim().length === 0 ||
    config.clientSecret.trim().length === 0 ||
    config.callbackUrl.trim().length === 0
  ) {
    throw new GitHubOAuthClientError('GitHub OAuth configuration is incomplete.', 'CONFIGURATION_ERROR')
  }
}

function normalizeOrganizationMembership(
  input: GitHubOrgMembershipResponse,
): { id: number; login: string; role: string } | null {
  const organization = input.organization

  if (
    !organization ||
    typeof organization.id !== 'number' ||
    typeof organization.login !== 'string'
  ) {
    return null
  }

  return {
    id: organization.id,
    login: organization.login,
    role: typeof input.role === 'string' ? input.role : 'member',
  }
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)

  return base64UrlEncode(bytes)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}
