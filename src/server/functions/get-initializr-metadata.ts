import { createServerFn } from '@tanstack/react-start'
import {
  InitializrClientError,
  fetchInitializrMetadata,
  type InitializrMetadata,
} from '../lib/initializr-client'
import {
  METADATA_CACHE_TTL_MS,
  getCachedMetadata,
  setCachedMetadata,
  type MetadataCacheInstrumentation,
} from '../lib/metadata-cache'

export type InitializrMetadataSuccess = {
  ok: true
  metadata: InitializrMetadata
  source: 'cache' | 'upstream'
  cache: MetadataCacheInstrumentation
}

export type InitializrMetadataError = {
  ok: false
  error: {
    code: 'METADATA_UNAVAILABLE'
    message: string
    retryable: boolean
  }
}

export type InitializrMetadataResponse =
  | InitializrMetadataSuccess
  | InitializrMetadataError

export const getInitializrMetadata = createServerFn({ method: 'GET' }).handler(
  async (): Promise<InitializrMetadataResponse> => getInitializrMetadataFromBff(),
)

export async function getInitializrMetadataFromBff(): Promise<InitializrMetadataResponse> {
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
