import { createServerFn } from '@tanstack/react-start'

import {
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  type AgentsMdPreferences,
} from '@/features/ai-extras/model/ai-extras'

import {
  type GeneratedProjectFile,
  type ProjectPreviewInput,
} from '../infra/initializr-preview-client'
import {
  normalizeStringArray,
  parsePayload,
  projectConfigSchema,
  z,
} from '@/server/shared/validation'
import { executeGetProjectPreview } from '../domain/get-project-preview'

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
  return executeGetProjectPreview(input)
}

function normalizePreviewInput(input: unknown): ProjectPreviewInput {
  const parsed = parsePayload(
    z.object({
      config: projectConfigSchema,
      selectedDependencyIds: z.array(z.string()),
      selectedAiExtraIds: z.array(z.string()).optional(),
      agentsMdPreferences: z.record(z.string(), z.boolean()).optional(),
      aiExtrasTarget: z.string().optional(),
    }),
    input,
    'Invalid preview input payload.',
  )

  return {
    config: parsed.config,
    selectedDependencyIds: normalizeStringArray(parsed.selectedDependencyIds),
    selectedAiExtraIds: normalizeSelectedAiExtraIds(
      normalizeStringArray(parsed.selectedAiExtraIds ?? []),
    ),
    agentsMdPreferences: normalizeAgentsMdPreferences(
      parsed.agentsMdPreferences as Partial<AgentsMdPreferences> | undefined,
    ),
    aiExtrasTarget: normalizeAiExtrasTarget(parsed.aiExtrasTarget),
  }
}
