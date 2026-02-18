import {
  buildInitializrGenerateParams,
  type InitializrGenerateParamEntry,
  type InitializrGenerationInput,
} from '@/shared/lib/project-config/initializr-generate-params'

import {
  InitializrGenerateClientError,
  fetchInitializrZip,
} from '../infra/initializr-generate-client'
import { augmentGeneratedProjectWithAiExtras } from '../infra/augment-generated-project-with-ai-extras'
import type {
  DownloadInitializrProjectError,
  DownloadInitializrProjectInput,
  DownloadInitializrProjectResponse,
} from '../functions/download-initializr-project'

export async function executeDownloadInitializrProject(
  input: DownloadInitializrProjectInput,
): Promise<DownloadInitializrProjectResponse> {
  try {
    const params = buildInitializrGenerateParams(toGenerationInput(input))
    let archive: Awaited<ReturnType<typeof fetchInitializrZip>>

    try {
      archive = await fetchInitializrZip({ params })
    } catch (error) {
      if (!hasBootVersionParam(params)) {
        throw error
      }

      archive = await fetchInitializrZip({ params: stripParam(params, 'bootVersion') })
    }

    const archiveBytes = await augmentGeneratedProjectWithAiExtras({
      archiveBytes: archive.bytes,
      config: input.config,
      selectedAiExtraIds: input.selectedAiExtraIds,
      agentsMdPreferences: input.agentsMdPreferences,
      aiExtrasTarget: input.aiExtrasTarget,
    })

    return {
      ok: true,
      archive: {
        base64: encodeBytesToBase64(archiveBytes),
        contentType: archive.contentType,
        filename: archive.suggestedFilename,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: sanitizeDownloadError(error),
    }
  }
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function toGenerationInput(input: DownloadInitializrProjectInput): InitializrGenerationInput {
  return {
    buildTool: input.config.buildTool,
    language: input.config.language,
    springBootVersion: input.config.springBootVersion,
    group: input.config.group,
    artifact: input.config.artifact,
    name: input.config.name,
    description: input.config.description,
    packageName: input.config.packageName,
    packaging: input.config.packaging,
    javaVersion: input.config.javaVersion,
    selectedDependencyIds: input.selectedDependencyIds,
  }
}

function hasBootVersionParam(params: InitializrGenerateParamEntry[]): boolean {
  return params.some(([key]) => key === 'bootVersion')
}

function stripParam(
  params: InitializrGenerateParamEntry[],
  keyToRemove: string,
): InitializrGenerateParamEntry[] {
  return params.filter(([key]) => key !== keyToRemove)
}

function sanitizeDownloadError(error: unknown): DownloadInitializrProjectError['error'] {
  if (error instanceof InitializrGenerateClientError) {
    return {
      code: 'PROJECT_DOWNLOAD_UNAVAILABLE',
      message:
        'Spring Initializr project download is temporarily unavailable. Please try again in a moment.',
      retryable: true,
    }
  }

  return {
    code: 'PROJECT_DOWNLOAD_UNAVAILABLE',
    message: 'Unable to generate project archive right now. Please try again shortly.',
    retryable: true,
  }
}
