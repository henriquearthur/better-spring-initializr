import { useEffect, useState } from 'react'

import type { AgentsMdPreferences, AiExtrasTarget } from '@/features/ai-extras/model/ai-extras'
import { resolveDependencyPreviewDiff } from '@/features/dependencies/model/dependency-preview-diff'
import { type PreviewFileDiff } from '@/features/preview/model/preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'
import { useProjectPreview } from '@/features/preview/hooks/use-project-preview'
import { DEFAULT_PROJECT_CONFIG, type ProjectConfig } from '@/shared/lib/project-config'

type UsePreviewStateInput = {
  config: ProjectConfig
  selectedDependencyIds: string[]
  selectedAiExtraIds: string[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
}

export type PreviewState = {
  files: PreviewSnapshotFile[] | undefined
  isLoading: boolean
  errorMessage: string | undefined
  selectedFilePath: string | null
  selectedFile: PreviewSnapshotFile | null
  selectedFileDiff: PreviewFileDiff | null
  fileDiffByPath: Record<string, PreviewFileDiff> | undefined
  selectFile: (path: string | null) => void
  retryPreview: () => void
}

export function usePreviewState(input: UsePreviewStateInput): PreviewState {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)

  const baselinePreviewQuery = useProjectPreview({
    config: DEFAULT_PROJECT_CONFIG,
    selectedDependencyIds: [],
    selectedAiExtraIds: input.selectedAiExtraIds,
    agentsMdPreferences: input.agentsMdPreferences,
    aiExtrasTarget: input.aiExtrasTarget,
  })

  const projectPreviewQuery = useProjectPreview({
    config: input.config,
    selectedDependencyIds: input.selectedDependencyIds,
    selectedAiExtraIds: input.selectedAiExtraIds,
    agentsMdPreferences: input.agentsMdPreferences,
    aiExtrasTarget: input.aiExtrasTarget,
  })

  const dependencyDiff = resolveDependencyPreviewDiff(
    baselinePreviewQuery.data,
    projectPreviewQuery.data,
  )

  const previewResult = projectPreviewQuery.data
  const files = previewResult?.ok ? previewResult.snapshot.files : undefined

  const fileMap = (() => {
    const map = new Map<string, PreviewSnapshotFile>()

    for (const file of files ?? []) {
      map.set(file.path, file)
    }

    return map
  })()

  const errorMessage =
    previewResult && !previewResult.ok
      ? previewResult.error.message
      : projectPreviewQuery.error
        ? projectPreviewQuery.error.message
        : undefined

  const selectedFile = selectedFilePath
    ? fileMap.get(selectedFilePath) ?? null
    : null

  const fileDiffByPath = dependencyDiff?.files

  const selectedFileDiff =
    selectedFilePath && dependencyDiff
      ? dependencyDiff.files[selectedFilePath] ?? null
      : null

  useEffect(() => {
    if (!selectedFilePath || !files) {
      return
    }

    const fileStillExists = files.some((file) => file.path === selectedFilePath)

    if (!fileStillExists) {
      setSelectedFilePath(null)
    }
  }, [files, selectedFilePath])

  const selectFile = (path: string | null) => {
    setSelectedFilePath(path)
  }

  const retryPreview = () => {
    void projectPreviewQuery.refetch()
  }

  return {
    files,
    isLoading: projectPreviewQuery.isPending,
    errorMessage,
    selectedFilePath,
    selectedFile,
    selectedFileDiff,
    fileDiffByPath,
    selectFile,
    retryPreview,
  }
}
