import { Suspense, lazy } from 'react'

import { FeaturePanelFallback } from '@/shared/ui/feature-panel-fallback'
import { type PreviewFileDiff } from '@/features/preview/model/preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'

const FileContentViewer = lazy(async () => {
  const module = await import('@/features/preview/components/file-content-viewer')

  return { default: module.FileContentViewer }
})

type PreviewContentPanelProps = {
  file: PreviewSnapshotFile | null
  isLoading: boolean
  diff: PreviewFileDiff | null
  onRetry: () => void
}

export function PreviewContentPanel({
  file,
  isLoading,
  diff,
  onRetry,
}: PreviewContentPanelProps) {
  return (
    <Suspense fallback={<FeaturePanelFallback label="Loading file viewer..." />}>
      <FileContentViewer
        file={file}
        isLoading={isLoading}
        diff={diff}
        onRetry={onRetry}
      />
    </Suspense>
  )
}
