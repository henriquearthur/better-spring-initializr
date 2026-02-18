import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as oauthClient from '../infra/github-oauth-client'
import * as oauthSession from '../infra/github-oauth-session.server'
import {
  completeGitHubOAuthFromBff,
  getGitHubOAuthSessionFromBff,
  startGitHubOAuthFromBff,
} from './github-oauth'

describe('github oauth server functions', () => {
  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = 'client-id'
    process.env.GITHUB_CLIENT_SECRET = 'client-secret'
    process.env.GITHUB_OAUTH_CALLBACK_URL =
      'http://localhost:3000/api/github/oauth/callback'
    process.env.GITHUB_SESSION_SECRET = '12345678901234567890123456789012'
    vi.restoreAllMocks()
  })

  it('sets oauth state and returns authorization URL on start', async () => {
    vi.spyOn(oauthClient, 'createGitHubOAuthStart').mockResolvedValue({
      authorizationUrl: 'https://github.com/login/oauth/authorize?client_id=client-id',
      state: 'oauth-state',
      codeVerifier: 'oauth-verifier',
    })
    const setStateSpy = vi
      .spyOn(oauthSession, 'setGitHubOAuthStateCookie')
      .mockResolvedValue(undefined)

    const response = await startGitHubOAuthFromBff()

    expect(setStateSpy).toHaveBeenCalledWith({
      state: 'oauth-state',
      codeVerifier: 'oauth-verifier',
    })
    expect(response).toEqual({
      ok: true,
      authorizationUrl: 'https://github.com/login/oauth/authorize?client_id=client-id',
    })
  })

  it('returns sanitized GITHUB_AUTH_FAILED error when exchange fails on callback', async () => {
    vi.spyOn(oauthSession, 'consumeGitHubOAuthStateCookie').mockResolvedValue({
      codeVerifier: 'oauth-verifier',
    })
    vi.spyOn(oauthClient, 'exchangeCodeForToken').mockRejectedValue(
      new oauthClient.GitHubOAuthClientError('upstream token exchange failed', 'OAUTH_EXCHANGE_FAILED', 400),
    )

    const response = await completeGitHubOAuthFromBff({
      code: 'oauth-code',
      state: 'oauth-state',
    })

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'GITHUB_AUTH_FAILED',
        message: 'Unable to complete GitHub authorization right now. Please try again.',
        retryable: true,
      },
    })
  })

  it('returns connected session summary without exposing access token', async () => {
    vi.spyOn(oauthSession, 'getGitHubSessionCookie').mockResolvedValue({
      connectedAt: '2026-02-14T00:00:00.000Z',
      token: {
        accessToken: 'secret-token',
        tokenType: 'bearer',
        scope: 'repo read:org',
      },
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

    const response = await getGitHubOAuthSessionFromBff()

    expect(response).toEqual({
      ok: true,
      session: {
        connected: true,
        connectedAt: '2026-02-14T00:00:00.000Z',
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
      },
    })
  })
})
