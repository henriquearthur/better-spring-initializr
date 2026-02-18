import { describe, expect, it } from 'vitest'

import {
  buildGitHubCookieOptions,
  GitHubOAuthSessionError,
  verifyOAuthState,
} from './github-oauth-session'

describe('verifyOAuthState', () => {
  it('rejects callback when oauth state does not match', () => {
    expect(() =>
      verifyOAuthState({
        expectedState: 'expected-state',
        providedState: 'unexpected-state',
        createdAt: Date.now(),
        now: Date.now(),
        ttlMs: 60_000,
      }),
    ).toThrowError(
      expect.objectContaining<Partial<GitHubOAuthSessionError>>({
        code: 'STATE_MISMATCH',
      }),
    )
  })
})

describe('buildGitHubCookieOptions', () => {
  it('sets secure httpOnly sameSite=lax cookie options with bounded max-age', () => {
    const options = buildGitHubCookieOptions(600)

    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe('lax')
    expect(options.path).toBe('/')
    expect(options.maxAge).toBe(600)
  })
})
