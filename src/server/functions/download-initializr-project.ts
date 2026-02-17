import { createServerFn } from '@tanstack/react-start'

import {
  buildInitializrGenerateParams,
  type InitializrGenerateParamEntry,
  type InitializrGenerationInput,
} from '@/lib/initializr-generate-params'

import {
  InitializrGenerateClientError,
  fetchInitializrZip,
} from '../lib/initializr-generate-client'

export type DownloadInitializrProjectInput = {
  config: {
    group: string
    artifact: string
    name: string
    description: string
    packageName: string
    javaVersion: string
    springBootVersion: string
    buildTool: 'maven-project' | 'gradle-project'
    language: 'java' | 'kotlin'
    packaging: 'jar' | 'war'
  }
  selectedDependencyIds: string[]
}

export type DownloadInitializrProjectSuccess = {
  ok: true
  archive: {
    base64: string
    contentType: string
    filename: string
  }
}

export type DownloadInitializrProjectError = {
  ok: false
  error: {
    code: 'PROJECT_DOWNLOAD_UNAVAILABLE'
    message: string
    retryable: boolean
  }
}

export type DownloadInitializrProjectResponse =
  | DownloadInitializrProjectSuccess
  | DownloadInitializrProjectError

export const downloadInitializrProject = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<DownloadInitializrProjectResponse> =>
    downloadInitializrProjectFromBff(normalizeDownloadInput(data)),
)

export async function downloadInitializrProjectFromBff(
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

    return {
      ok: true,
      archive: {
        base64: encodeBytesToBase64(archive.bytes),
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

function normalizeDownloadInput(input: unknown): DownloadInitializrProjectInput {
  if (!isObject(input)) {
    throw new Error('Invalid download input payload.')
  }

  const config = input.config
  const selectedDependencyIds = input.selectedDependencyIds

  if (!isProjectConfig(config) || !Array.isArray(selectedDependencyIds)) {
    throw new Error('Invalid download input payload.')
  }

  return {
    config,
    selectedDependencyIds: selectedDependencyIds.filter(
      (dependencyId): dependencyId is string =>
        typeof dependencyId === 'string' && dependencyId.trim().length > 0,
    ),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProjectConfig(
  value: unknown,
): value is DownloadInitializrProjectInput['config'] {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.group === 'string' &&
    typeof value.artifact === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.packageName === 'string' &&
    typeof value.javaVersion === 'string' &&
    typeof value.springBootVersion === 'string' &&
    (value.buildTool === 'maven-project' || value.buildTool === 'gradle-project') &&
    (value.language === 'java' || value.language === 'kotlin') &&
    (value.packaging === 'jar' || value.packaging === 'war')
  )
}
