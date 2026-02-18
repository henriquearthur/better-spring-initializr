import { createServerFn } from '@tanstack/react-start'

import {
  type AgentsMdPreferences,
  type AiExtraId,
  type AiExtrasTarget,
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
} from '@/features/ai-extras/model/ai-extras'
import {
  normalizeStringArray,
  parsePayload,
  projectConfigSchema,
  z,
} from '@/server/shared/validation'

import { executeDownloadInitializrProject } from '../domain/download-initializr-project'

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
  selectedAiExtraIds: AiExtraId[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
  generationSource?: 'manual-download' | 'github-push'
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
  return executeDownloadInitializrProject(input)
}

function normalizeDownloadInput(input: unknown): DownloadInitializrProjectInput {
  const parsed = parsePayload(
    z.object({
      config: projectConfigSchema,
      selectedDependencyIds: z.array(z.string()),
      selectedAiExtraIds: z.array(z.string()).optional(),
      agentsMdPreferences: z.record(z.string(), z.boolean()).optional(),
      aiExtrasTarget: z.string().optional(),
      generationSource: z.enum(['manual-download', 'github-push']).optional(),
    }),
    input,
    'Invalid download input payload.',
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
    generationSource: parsed.generationSource ?? 'manual-download',
  }
}
