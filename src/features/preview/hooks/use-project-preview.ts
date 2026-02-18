import { useQuery } from '@tanstack/react-query'

import {
  type AgentsMdPreferences,
  type AiExtrasTarget,
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
} from '@/features/ai-extras/model/ai-extras'
import {
  getProjectPreview,
  type ProjectPreviewResponse,
} from '@/server/features/initializr/functions/get-project-preview'
import { useDebouncedValue } from '@/shared/lib/debounce'
import type { ProjectConfig } from '@/shared/lib/project-config'

type UseProjectPreviewInput = {
  config: ProjectConfig
  selectedDependencyIds: string[]
  selectedAiExtraIds: string[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
}

const PREVIEW_REFRESH_DEBOUNCE_MS = 350

class PreviewUnavailableError extends Error {
  constructor(readonly response: ProjectPreviewResponse & { ok: false }) {
    super(response.error.message)
  }
}

export function useProjectPreview(input: UseProjectPreviewInput) {
  const invokeProjectPreview =
    getProjectPreview as unknown as (payload: {
      data: UseProjectPreviewInput
    }) => Promise<ProjectPreviewResponse>

  const normalizedInput = {
    config: input.config,
    selectedDependencyIds: Array.from(new Set(input.selectedDependencyIds)).sort(),
    selectedAiExtraIds: normalizeSelectedAiExtraIds(input.selectedAiExtraIds),
    agentsMdPreferences: normalizeAgentsMdPreferences(input.agentsMdPreferences),
    aiExtrasTarget: normalizeAiExtrasTarget(input.aiExtrasTarget),
  }

  const debouncedInput = useDebouncedValue(normalizedInput, PREVIEW_REFRESH_DEBOUNCE_MS)

  return useQuery({
    queryKey: ['initializr', 'preview', debouncedInput],
    queryFn: async () => {
      const result = await invokeProjectPreview({ data: debouncedInput })

      if (!result.ok && result.error.retryable) {
        throw new PreviewUnavailableError(result)
      }

      return result
    },
    gcTime: 5 * 60_000,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
