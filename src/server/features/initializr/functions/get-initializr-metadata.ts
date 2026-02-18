import { createServerFn } from '@tanstack/react-start'
import {
  type InitializrMetadata,
} from '../infra/initializr-client'
import {
  type MetadataCacheInstrumentation,
} from '../infra/metadata-cache'
import { executeGetInitializrMetadata } from '../domain/get-initializr-metadata'

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
  async (): Promise<InitializrMetadataResponse> => executeGetInitializrMetadata(),
)

export async function getInitializrMetadataFromBff(): Promise<InitializrMetadataResponse> {
  return executeGetInitializrMetadata()
}
