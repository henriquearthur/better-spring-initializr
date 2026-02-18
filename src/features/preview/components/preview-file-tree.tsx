import { File, FolderClosed, FolderOpen, RotateCcw, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  type NodeApi,
  type NodeRendererProps,
  Tree as Arborist,
} from 'react-arborist'

import type { PreviewFileDiff } from '@/features/preview/model/preview-diff'
import {
  buildPreviewTree,
  type PreviewSnapshotFile,
  type PreviewTreeNode,
} from '@/features/preview/model/preview-tree'

type PreviewFileTreeProps = {
  files: PreviewSnapshotFile[] | undefined
  isLoading: boolean
  errorMessage?: string
  selectedFilePath: string | null
  onSelectFile: (path: string | null) => void
  fileDiffByPath?: Record<string, PreviewFileDiff>
  onRetry?: () => void
}

const FALLBACK_TREE_HEIGHT = 0

export function PreviewFileTree({
  files,
  isLoading,
  errorMessage,
  selectedFilePath,
  onSelectFile,
  fileDiffByPath,
  onRetry,
}: PreviewFileTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null)
  const [treeHeight, setTreeHeight] = useState(FALLBACK_TREE_HEIGHT)
  const treeData = buildPreviewTree(files ?? [])
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const hasSearchTerm = normalizedSearch.length > 0
  const setViewportRef = (element: HTMLDivElement | null) => {
    setViewportElement(element)
  }
  const hasMatchingNodes = hasSearchTerm ? countSearchMatches(treeData, normalizedSearch) > 0 : true

  useEffect(() => {
    if (!viewportElement) {
      return
    }

    const syncTreeHeight = () => {
      const measuredHeight = Math.floor(viewportElement.getBoundingClientRect().height)
      setTreeHeight((previousHeight) => {
        if (measuredHeight > 0) {
          return measuredHeight
        }

        return previousHeight > 0 ? previousHeight : FALLBACK_TREE_HEIGHT
      })
    }

    syncTreeHeight()
    const rafId = window.requestAnimationFrame(syncTreeHeight)

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncTreeHeight)

      return () => {
        window.cancelAnimationFrame(rafId)
        window.removeEventListener('resize', syncTreeHeight)
      }
    }

    const observer = new ResizeObserver(syncTreeHeight)
    observer.observe(viewportElement)

    return () => {
      window.cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [viewportElement])

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-[var(--card)]">
      <div className="border-b p-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">Find files</span>
          <div className="flex h-9 items-center rounded-md border bg-[var(--background)] px-2.5 text-sm focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
            <Search className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or path"
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="btn btn-ghost btn-sm h-7 px-2"
                aria-label="Clear file search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </label>
      </div>

      {!hasMatchingNodes ? (
        <div className="m-3 rounded-lg border border-dashed bg-[var(--card)] px-3 py-4 text-center">
          <p className="text-sm font-medium">No files match this search</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Try a shorter file name, package segment, or extension.
          </p>
        </div>
      ) : null}

      <div ref={setViewportRef} className="min-h-0 flex-1 overflow-hidden">
        <Arborist<PreviewTreeNode>
          data={treeData}
          width="100%"
          height={Math.max(treeHeight, 1)}
          rowHeight={28}
          paddingTop={0}
          paddingBottom={0}
          indent={16}
          className="preview-tree-scroll"
          selection={selectedFilePath ? `file:${selectedFilePath}` : undefined}
          searchTerm={normalizedSearch.length > 0 ? normalizedSearch : undefined}
          searchMatch={searchTreeNode}
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
  const changeDotClass =
    changeType === 'added'
      ? 'preview-tree-change-dot preview-tree-change-dot-added'
      : changeType === 'modified'
        ? 'preview-tree-change-dot preview-tree-change-dot-modified'
        : null

  return (
    <div style={style} className="min-w-0 overflow-hidden" data-node-id={node.id}>
      <button
        type="button"
        data-change-type={changeType}
        className={`preview-tree-row ${node.isSelected ? 'preview-tree-row-active' : ''}`}
        onClick={() => {
          if (isDirectory) {
            node.toggle()
            return
          }

          node.select()
        }}
        title={node.data.path}
        aria-label={
          isDirectory
            ? `${node.isOpen ? 'Collapse' : 'Expand'} ${node.data.path}`
            : `Open ${node.data.path}`
        }
      >
        <span className="shrink-0 text-[var(--muted-foreground)]">
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

        <span className="min-w-0 flex-1 truncate">{node.data.name}</span>

        {node.data.kind === 'file' && changeDotClass ? <span className={changeDotClass} aria-hidden="true" /> : null}
      </button>
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
      ? 'border-red-400/80 bg-red-100 text-red-950 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100'
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
          className="btn btn-secondary btn-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  )
}

function searchTreeNode(node: NodeApi<PreviewTreeNode>, normalizedSearch: string): boolean {
  return node.data.path.toLocaleLowerCase().includes(normalizedSearch)
}

function countSearchMatches(nodes: PreviewTreeNode[], normalizedSearch: string): number {
  let totalMatches = 0

  for (const node of nodes) {
    if (node.path.toLocaleLowerCase().includes(normalizedSearch)) {
      totalMatches += 1
    }

    if (node.kind === 'directory' && node.children) {
      totalMatches += countSearchMatches(node.children, normalizedSearch)
    }
  }

  return totalMatches
}
