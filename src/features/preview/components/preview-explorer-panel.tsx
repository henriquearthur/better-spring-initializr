import { lazy,Suspense } from 'react'

import { type PreviewFileDiff } from '@/features/preview/model/preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'
import { FeaturePanelFallback } from '@/shared/ui/feature-panel-fallback'

const PreviewFileTree = lazy(async () => {
  const module = await import('@/features/preview/components/preview-file-tree')

  return { default: module.PreviewFileTree }
})

type PreviewExplorerPanelProps = {
  files: PreviewSnapshotFile[] | undefined
  isLoading: boolean
  errorMessage?: string
  selectedFilePath: string | null
  onSelectFile: (path: string | null) => void
  fileDiffByPath?: Record<string, PreviewFileDiff>
  onRetry: () => void
}

export function PreviewExplorerPanel({
  files,
  isLoading,
  errorMessage,
  selectedFilePath,
  onSelectFile,
  fileDiffByPath,
  onRetry,
}: PreviewExplorerPanelProps) {
  return (
    <Suspense fallback={<FeaturePanelFallback label="Loading preview explorer..." />}>
      <PreviewFileTree
        files={files}
        isLoading={isLoading}
        errorMessage={errorMessage}
        selectedFilePath={selectedFilePath}
        onSelectFile={onSelectFile}
        fileDiffByPath={fileDiffByPath}
        onRetry={onRetry}
      />
    </Suspense>
  )
}
