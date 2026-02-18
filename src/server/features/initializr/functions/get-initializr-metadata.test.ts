import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as initializrClient from '../infra/initializr-client'
import { clearMetadataCache } from '../infra/metadata-cache'
import { getInitializrMetadataFromBff } from './get-initializr-metadata'

const metadataFixture = {
  dependencies: [
    {
      id: 'web',
      name: 'Spring Web',
      description: 'Build web applications',
      default: false,
      group: 'Core',
    },
  ],
  javaVersions: [{ id: '21', name: '21', default: true }],
  springBootVersions: [{ id: '3.4.0', name: '3.4.0', default: true }],
}

describe('getInitializrMetadataFromBff', () => {
  beforeEach(() => {
    clearMetadataCache()
    vi.restoreAllMocks()
  })

  it('fetches upstream on first call and serves cache on second call', async () => {
    const fetchSpy = vi
      .spyOn(initializrClient, 'fetchInitializrMetadata')
      .mockResolvedValue(metadataFixture)

    const firstCall = await getInitializrMetadataFromBff()
    const secondCall = await getInitializrMetadataFromBff()

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    expect(firstCall.ok).toBe(true)
    expect(firstCall.ok && firstCall.source).toBe('upstream')

    expect(secondCall.ok).toBe(true)
    expect(secondCall.ok && secondCall.source).toBe('cache')
    expect(secondCall.ok && secondCall.cache.status).toBe('hit')
  })

  it('returns sanitized, client-safe error payload when upstream fails', async () => {
    vi.spyOn(initializrClient, 'fetchInitializrMetadata').mockRejectedValue(
      new initializrClient.InitializrClientError(
        'Low-level upstream details should not leak',
        'UPSTREAM_ERROR',
        503,
      ),
    )

    const result = await getInitializrMetadataFromBff()

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'METADATA_UNAVAILABLE',
        message:
          'Spring Initializr metadata is temporarily unavailable. Please try again in a moment.',
        retryable: true,
      },
    })
  })
})
