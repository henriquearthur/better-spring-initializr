import { describe, expect, it } from 'vitest'

import {
  createGitHubOAuthStart,
  exchangeCodeForToken,
  fetchAuthenticatedUser,
  GitHubOAuthClientError,
} from './github-oauth-client'

const oauthConfig = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  callbackUrl: 'http://localhost:3000/api/github/oauth/callback',
}

describe('createGitHubOAuthStart', () => {
  it('builds authorization URL with repo/read:org scope and PKCE S256 challenge', async () => {
    const start = await createGitHubOAuthStart(oauthConfig)

    const url = new URL(start.authorizationUrl)

    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe(oauthConfig.clientId)
    expect(url.searchParams.get('redirect_uri')).toBe(oauthConfig.callbackUrl)
    expect(url.searchParams.get('scope')).toBe('repo read:org')
    expect(url.searchParams.get('state')).toBe(start.state)
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')

    expect(start.state.length).toBeGreaterThan(20)
    expect(start.codeVerifier.length).toBeGreaterThan(40)
  })
})

describe('exchangeCodeForToken', () => {
  it('maps non-ok token exchange response to typed oauth failure', async () => {
    const failingFetch = async () =>
      new Response(JSON.stringify({ error: 'bad_verification_code' }), { status: 401 })

    await expect(
      exchangeCodeForToken({
        config: oauthConfig,
        code: 'bad-code',
        codeVerifier: 'verifier',
        fetch: failingFetch as typeof fetch,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<GitHubOAuthClientError>>({
        code: 'OAUTH_EXCHANGE_FAILED',
        status: 401,
      }),
    )
  })
})

describe('fetchAuthenticatedUser', () => {
  it('returns user identity and org memberships for owner selection', async () => {
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input)

      if (url.endsWith('/user')) {
        return new Response(
          JSON.stringify({
            id: 42,
            login: 'octocat',
            name: 'The Octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          }),
          { status: 200 },
        )
      }

      return new Response(
        JSON.stringify([
          {
            role: 'admin',
            organization: {
              id: 99,
              login: 'acme-inc',
            },
          },
        ]),
        { status: 200 },
      )
    }

    const identity = await fetchAuthenticatedUser('token-value', { fetch: fetchMock })

    expect(identity).toEqual({
      user: {
        id: 42,
        login: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      organizations: [
        {
          id: 99,
          login: 'acme-inc',
          role: 'admin',
        },
      ],
    })
  })
})
