import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearMetadataCache,
  getCachedMetadata,
  setCachedMetadata,
} from './metadata-cache'

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

describe('metadata-cache', () => {
  beforeEach(() => {
    clearMetadataCache()
  })

  it('reports miss before cache is populated', () => {
    const result = getCachedMetadata(100)

    expect(result.metadata).toBeNull()
    expect(result.cache.status).toBe('miss')
    expect(result.cache.expiresAt).toBeNull()
  })

  it('returns cache hit while entry is within TTL', () => {
    setCachedMetadata(metadataFixture, 5000, 100)

    const result = getCachedMetadata(101)

    expect(result.metadata).toEqual(metadataFixture)
    expect(result.cache.status).toBe('hit')
    expect(result.cache.expiresAt).toBe(5100)
  })

  it('expires stale entries and reports miss', () => {
    setCachedMetadata(metadataFixture, 10, 100)

    const result = getCachedMetadata(111)

    expect(result.metadata).toBeNull()
    expect(result.cache.status).toBe('miss')
    expect(result.cache.expiresAt).toBe(110)
  })
})
