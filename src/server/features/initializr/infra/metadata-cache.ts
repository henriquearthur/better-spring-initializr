import type { InitializrMetadata } from './initializr-client'

export const METADATA_CACHE_TTL_MS = 5 * 60 * 1000

export type MetadataCacheStatus = 'hit' | 'miss'

export type MetadataCacheInstrumentation = {
  status: MetadataCacheStatus
  cachedAt: number | null
  expiresAt: number | null
  ttlMs: number
}

type MetadataCacheEntry = {
  value: InitializrMetadata
  cachedAt: number
  expiresAt: number
  ttlMs: number
}

let metadataCache: MetadataCacheEntry | null = null

export function getCachedMetadata(now = Date.now()): {
  metadata: InitializrMetadata | null
  cache: MetadataCacheInstrumentation
} {
  if (!metadataCache) {
    return {
      metadata: null,
      cache: {
        status: 'miss',
        cachedAt: null,
        expiresAt: null,
        ttlMs: METADATA_CACHE_TTL_MS,
      },
    }
  }

  if (metadataCache.expiresAt <= now) {
    const expired = metadataCache
    metadataCache = null

    return {
      metadata: null,
      cache: {
        status: 'miss',
        cachedAt: expired.cachedAt,
        expiresAt: expired.expiresAt,
        ttlMs: expired.ttlMs,
      },
    }
  }

  return {
    metadata: metadataCache.value,
    cache: {
      status: 'hit',
      cachedAt: metadataCache.cachedAt,
      expiresAt: metadataCache.expiresAt,
      ttlMs: metadataCache.ttlMs,
    },
  }
}

export function setCachedMetadata(
  metadata: InitializrMetadata,
  ttlMs = METADATA_CACHE_TTL_MS,
  now = Date.now(),
): MetadataCacheInstrumentation {
  metadataCache = {
    value: metadata,
    cachedAt: now,
    expiresAt: now + ttlMs,
    ttlMs,
  }

  return {
    status: 'hit',
    cachedAt: metadataCache.cachedAt,
    expiresAt: metadataCache.expiresAt,
    ttlMs: metadataCache.ttlMs,
  }
}

export function clearMetadataCache() {
  metadataCache = null
}
