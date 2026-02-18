import type {
  ProjectPreviewError,
  ProjectPreviewResponse,
} from '../functions/get-project-preview'
import {
  fetchInitializrProjectPreview,
  InitializrPreviewClientError,
  type ProjectPreviewInput,
} from '../infra/initializr-preview-client'

export async function executeGetProjectPreview(
  input: ProjectPreviewInput,
): Promise<ProjectPreviewResponse> {
  try {
    const files = await fetchInitializrProjectPreview(input)

    return {
      ok: true,
      snapshot: {
        generatedAt: new Date().toISOString(),
        files,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizePreviewError(error),
    }
  }
}

function sanitizePreviewError(error: unknown): ProjectPreviewError['error'] {
  if (error instanceof InitializrPreviewClientError) {
    if (error.code === 'UPSTREAM_ERROR') {
      return {
        code: 'PREVIEW_UNAVAILABLE',
        message:
          'Spring Initializr preview is temporarily unavailable. Please try again in a moment.',
        retryable: true,
      }
    }

    return {
      code: 'PREVIEW_UNAVAILABLE',
      message: 'Preview response could not be processed. Please retry shortly.',
      retryable: true,
    }
  }

  return {
    code: 'PREVIEW_UNAVAILABLE',
    message: 'Unable to load preview right now. Please try again shortly.',
    retryable: true,
  }
}
