import {
  InitializrClientError,
  fetchInitializrMetadata,
} from '../infra/initializr-client'
import {
  METADATA_CACHE_TTL_MS,
  getCachedMetadata,
  setCachedMetadata,
} from '../infra/metadata-cache'
import type { InitializrMetadataResponse } from '../functions/get-initializr-metadata'

export async function executeGetInitializrMetadata(): Promise<InitializrMetadataResponse> {
  const cached = getCachedMetadata()

  if (cached.metadata) {
    return {
      ok: true,
      metadata: cached.metadata,
      source: 'cache',
      cache: cached.cache,
    }
  }

  try {
    const metadata = await fetchInitializrMetadata()
    const cache = setCachedMetadata(metadata, METADATA_CACHE_TTL_MS)

    return {
      ok: true,
      metadata,
      source: 'upstream',
      cache,
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeInitializrError(error),
    }
  }
}

function sanitizeInitializrError(error: unknown) {
  if (error instanceof InitializrClientError) {
    if (error.code === 'UPSTREAM_ERROR') {
      return {
        code: 'METADATA_UNAVAILABLE' as const,
        message:
          'Spring Initializr metadata is temporarily unavailable. Please try again in a moment.',
        retryable: true,
      }
    }

    return {
      code: 'METADATA_UNAVAILABLE' as const,
      message:
        'Received an unexpected metadata payload from Spring Initializr. Please retry shortly.',
      retryable: true,
    }
  }

  return {
    code: 'METADATA_UNAVAILABLE' as const,
    message: 'Unable to load Spring metadata right now. Please try again shortly.',
    retryable: true,
  }
}
