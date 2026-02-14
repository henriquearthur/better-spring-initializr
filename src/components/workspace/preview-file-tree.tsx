import { File, FolderClosed, FolderOpen } from 'lucide-react'
import { useMemo } from 'react'
import { Tree as Arborist, type NodeRendererProps } from 'react-arborist'

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
}

export function PreviewFileTree({
  files,
  isLoading,
  errorMessage,
  selectedFilePath,
  onSelectFile,
}: PreviewFileTreeProps) {
  const treeData = useMemo(() => buildPreviewTree(files ?? []), [files])

  if (isLoading) {
    return <StatusPanel message="Generating project snapshot..." tone="muted" />
  }

  if (errorMessage) {
    return <StatusPanel message={errorMessage} tone="error" />
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
        {PreviewTreeRow}
      </Arborist>
    </div>
  )
}

function PreviewTreeRow({ node, style }: NodeRendererProps<PreviewTreeNode>) {
  const isDirectory = node.data.kind === 'directory'

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
    </div>
  )
}

type StatusPanelProps = {
  message: string
  tone: 'muted' | 'error'
}

function StatusPanel({ message, tone }: StatusPanelProps) {
  const palette =
    tone === 'error'
      ? 'border-red-300/70 bg-red-50/70 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'
      : 'border-dashed text-[var(--muted-foreground)]'

  return (
    <div
      className={`flex h-full min-h-[420px] items-center justify-center rounded-xl border px-4 text-sm ${palette}`}
    >
      {message}
    </div>
  )
}
