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
    queryFn: () => invokeProjectPreview({ data: debouncedInput }),
    gcTime: 5 * 60_000,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
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
