import { createServerFn } from '@tanstack/react-start'

import {
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  type AgentsMdPreferences,
} from '@/lib/ai-extras'

import {
  InitializrPreviewClientError,
  fetchInitializrProjectPreview,
  type GeneratedProjectFile,
  type ProjectPreviewInput,
} from '../lib/initializr-preview-client'

export type ProjectPreviewSuccess = {
  ok: true
  snapshot: {
    generatedAt: string
    files: GeneratedProjectFile[]
  }
}

export type ProjectPreviewError = {
  ok: false
  error: {
    code: 'PREVIEW_UNAVAILABLE'
    message: string
    retryable: boolean
  }
}

export type ProjectPreviewResponse = ProjectPreviewSuccess | ProjectPreviewError

export const getProjectPreview = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<ProjectPreviewResponse> =>
    getProjectPreviewFromBff(normalizePreviewInput(data)),
)

export async function getProjectPreviewFromBff(
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

function normalizePreviewInput(input: unknown): ProjectPreviewInput {
  if (!isObject(input)) {
    throw new Error('Invalid preview input payload.')
  }

  const config = input.config
  const selectedDependencyIds = input.selectedDependencyIds

  if (!isProjectConfig(config) || !Array.isArray(selectedDependencyIds)) {
    throw new Error('Invalid preview input payload.')
  }

  return {
    config,
    selectedDependencyIds: selectedDependencyIds.filter(
      (dependencyId): dependencyId is string =>
        typeof dependencyId === 'string' && dependencyId.trim().length > 0,
    ),
    selectedAiExtraIds: normalizeSelectedAiExtraIds(
      Array.isArray(input.selectedAiExtraIds)
        ? input.selectedAiExtraIds.filter(
            (extraId): extraId is string =>
              typeof extraId === 'string' && extraId.trim().length > 0,
          )
        : [],
    ),
    agentsMdPreferences: normalizeAgentsMdPreferences(
      isObject(input.agentsMdPreferences)
        ? (input.agentsMdPreferences as Partial<AgentsMdPreferences>)
        : undefined,
    ),
    aiExtrasTarget: normalizeAiExtrasTarget(input.aiExtrasTarget),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProjectConfig(value: unknown): value is ProjectPreviewInput['config'] {
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
