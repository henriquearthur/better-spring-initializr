import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_AGENTS_MD_PREFERENCES } from '@/features/ai-extras/model/ai-extras'
import { encodeShareConfig } from '@/features/share/model/share-config'
import { DEFAULT_PROJECT_CONFIG } from '@/shared/lib/project-config'

import {
  buildGitHubOAuthWorkspaceRedirectPath,
  cacheGitHubOAuthResumeSnapshot,
  consumeGitHubOAuthResumeShareToken,
  GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY,
} from './github-oauth-resume'

describe('github oauth resume token helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('caches and consumes a share token while clearing storage key', () => {
    const sessionStorage = createMemoryStorage()
    vi.stubGlobal('window', { sessionStorage } as Window & typeof globalThis)

    const snapshot = {
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
        artifact: 'oauth-resume-demo',
      },
      selectedDependencyIds: ['web', 'actuator'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents' as const,
    }
    const expectedShareToken = encodeShareConfig(snapshot)

    cacheGitHubOAuthResumeSnapshot(snapshot)

    expect(sessionStorage.getItem(GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY)).toBe(
      expectedShareToken,
    )

    const consumedShareToken = consumeGitHubOAuthResumeShareToken()

    expect(consumedShareToken).toBe(expectedShareToken)
    expect(sessionStorage.getItem(GITHUB_OAUTH_RESUME_SHARE_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('returns null when no cached share token exists', () => {
    const sessionStorage = createMemoryStorage()
    vi.stubGlobal('window', { sessionStorage } as Window & typeof globalThis)

    expect(consumeGitHubOAuthResumeShareToken()).toBeNull()
  })

  it('builds redirect path with github status when share token is missing', () => {
    expect(buildGitHubOAuthWorkspaceRedirectPath('connected')).toBe('/?github=connected')
  })

  it('builds redirect path with share and github query params when token is present', () => {
    const redirectPath = buildGitHubOAuthWorkspaceRedirectPath(
      'error',
      'resume-token-123',
    )
    const params = new URLSearchParams(redirectPath.slice(2))

    expect(params.get('share')).toBe('resume-token-123')
    expect(params.get('github')).toBe('error')
  })

  it('does not throw when sessionStorage is unavailable', () => {
    const brokenWindow = {}
    Object.defineProperty(brokenWindow, 'sessionStorage', {
      get() {
        throw new Error('storage unavailable')
      },
    })
    vi.stubGlobal('window', brokenWindow as Window & typeof globalThis)

    expect(() =>
      cacheGitHubOAuthResumeSnapshot({
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: [],
        selectedAiExtraIds: [],
        agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
        aiExtrasTarget: 'agents',
      }),
    ).not.toThrow()
    expect(consumeGitHubOAuthResumeShareToken()).toBeNull()
  })
})

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, String(value))
    },
  }
}
