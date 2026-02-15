import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type { ProjectConfig } from '@/lib/project-config'
import {
  getProjectPreview,
  type ProjectPreviewResponse,
} from '@/server/functions/get-project-preview'

type UseProjectPreviewInput = {
  config: ProjectConfig
  selectedDependencyIds: string[]
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

  const normalizedInput = useMemo(
    () => ({
      config: input.config,
      selectedDependencyIds: Array.from(new Set(input.selectedDependencyIds)).sort(),
    }),
    [input.config, input.selectedDependencyIds],
  )

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

function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delayMs, value])

  return debouncedValue
}
