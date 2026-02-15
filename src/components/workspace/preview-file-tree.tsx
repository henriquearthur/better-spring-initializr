import { File, FolderClosed, FolderOpen, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { Tree as Arborist, type NodeRendererProps } from 'react-arborist'

import type { PreviewFileDiff } from '@/lib/preview-diff'
import {
  buildPreviewTree,
  type PreviewSnapshotFile,
  type PreviewTreeNode,
} from '@/lib/preview-tree'

type PreviewFileTreeProps = {
  files: PreviewSnapshotFile[] | undefined
  isLoading: boolean
  errorMessage?: string
  selectedFilePath: string | null
  onSelectFile: (path: string | null) => void
  fileDiffByPath?: Record<string, PreviewFileDiff>
  onRetry?: () => void
}

export function PreviewFileTree({
  files,
  isLoading,
  errorMessage,
  selectedFilePath,
  onSelectFile,
  fileDiffByPath,
  onRetry,
}: PreviewFileTreeProps) {
  const treeData = useMemo(() => buildPreviewTree(files ?? []), [files])

  if (isLoading) {
    return <StatusPanel message="Generating project snapshot..." tone="muted" />
  }

  if (errorMessage) {
    return <StatusPanel message={errorMessage} tone="error" onRetry={onRetry} />
  }

  if (treeData.length === 0) {
    return <StatusPanel message="No files found in the generated project." tone="muted" />
  }

  return (
    <div className="h-full rounded-xl border bg-[var(--card)]">
      <Arborist<PreviewTreeNode>
        data={treeData}
        width="100%"
        height={520}
        rowHeight={30}
        paddingTop={8}
        paddingBottom={8}
        indent={20}
        openByDefault={false}
        selection={selectedFilePath ? `file:${selectedFilePath}` : undefined}
        onSelect={(nodes) => {
          const firstNode = nodes[0]

          if (!firstNode) {
            onSelectFile(null)
            return
          }

          if (firstNode.data.kind === 'file') {
            onSelectFile(firstNode.data.path)
          }
        }}
      >
        {(props) => <PreviewTreeRow {...props} fileDiffByPath={fileDiffByPath} />}
      </Arborist>
    </div>
  )
}

type PreviewTreeRowProps = NodeRendererProps<PreviewTreeNode> & {
  fileDiffByPath?: Record<string, PreviewFileDiff>
}

function PreviewTreeRow({ node, style, fileDiffByPath }: PreviewTreeRowProps) {
  const isDirectory = node.data.kind === 'directory'
  const changeType =
    node.data.kind === 'file' ? fileDiffByPath?.[node.data.path]?.changeType ?? 'unchanged' : 'unchanged'
  const rowBadgeClass =
    changeType === 'added'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : changeType === 'modified'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-transparent text-transparent'
  const rowBadgeLabel = changeType === 'added' ? 'A' : changeType === 'modified' ? 'M' : ''

  return (
    <div
      style={style}
      className="group flex items-center gap-2 px-2 text-sm"
      onClick={() => {
        if (isDirectory) {
          node.toggle()
          return
        }

        node.select()
      }}
    >
      <span className="text-[var(--muted-foreground)]">
        {isDirectory ? (
          node.isOpen ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <FolderClosed className="h-4 w-4" />
          )
        ) : (
          <File className="h-4 w-4" />
        )}
      </span>
      <span
        className={
          node.isSelected
            ? 'font-medium text-emerald-700 dark:text-emerald-300'
            : 'text-[var(--foreground)]'
        }
      >
        {node.data.name}
      </span>
      {node.data.kind === 'file' ? (
        <span
          className={`ml-auto min-w-5 rounded border px-1 text-center text-[10px] font-semibold ${rowBadgeClass}`}
        >
          {rowBadgeLabel}
        </span>
      ) : null}
    </div>
  )
}

type StatusPanelProps = {
  message: string
  tone: 'muted' | 'error'
  onRetry?: () => void
}

function StatusPanel({ message, tone, onRetry }: StatusPanelProps) {
  const palette =
    tone === 'error'
      ? 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'
      : 'border-dashed text-[var(--muted-foreground)]'

  return (
    <div
      className={`flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border px-4 text-sm ${palette}`}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition hover:bg-[var(--muted)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  )
}
