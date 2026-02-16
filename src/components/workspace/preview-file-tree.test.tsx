import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import type { PreviewFileDiff } from '@/lib/preview-diff'
import type { PreviewSnapshotFile } from '@/lib/preview-tree'

vi.mock('react-arborist', () => {
  type MockTreeNode = {
    id: string
    kind: 'directory' | 'file'
    path: string
    name: string
    children?: MockTreeNode[]
  }

  const flatten = (nodes: MockTreeNode[]): MockTreeNode[] => {
    const output: MockTreeNode[] = []

    for (const node of nodes) {
      output.push(node)

      if (node.children) {
        output.push(...flatten(node.children))
      }
    }

    return output
  }

  const Tree = ({ data = [], selection, children }: any) => {
    const rows = flatten(data)

    return (
      <div data-testid="mock-tree">
        {rows.map((row) => {
          const node = {
            id: row.id,
            data: row,
            isOpen: true,
            isSelected: selection === row.id,
            toggle: vi.fn(),
            select: vi.fn(),
          }

          return <div key={row.id}>{children({ node, style: {} })}</div>
        })}
      </div>
    )
  }

  return {
    Tree,
  }
})

import { PreviewFileTree } from './preview-file-tree'

const filesFixture: PreviewSnapshotFile[] = [
  {
    path: 'src/main/java/com/example/DemoApplication.java',
    size: 42,
    binary: false,
    hash: 'demo-a',
    content: 'class DemoApplication {}',
  },
  {
    path: 'src/main/resources/application.yml',
    size: 19,
    binary: false,
    hash: 'demo-b',
    content: 'server:\n  port: 8080',
  },
]

const fileDiffByPath: Record<string, PreviewFileDiff> = {
  'src/main/java/com/example/DemoApplication.java': {
    path: 'src/main/java/com/example/DemoApplication.java',
    changeType: 'added',
    binary: false,
    lineDiff: null,
  },
  'src/main/resources/application.yml': {
    path: 'src/main/resources/application.yml',
    changeType: 'modified',
    binary: false,
    lineDiff: null,
  },
}

describe('PreviewFileTree rows', () => {
  it('renders row classes for pointer affordance and selected style', () => {
    const html = renderToString(
      <PreviewFileTree
        files={filesFixture}
        isLoading={false}
        selectedFilePath="src/main/java/com/example/DemoApplication.java"
        onSelectFile={() => undefined}
        fileDiffByPath={fileDiffByPath}
      />,
    )

    expect(html).toContain('preview-tree-row preview-tree-row-active')
    expect(html).toContain('aria-label="Open src/main/java/com/example/DemoApplication.java"')
    expect(html).not.toContain('>A</span>')
    expect(html).not.toContain('>M</span>')
  })

  it('renders subtle change dots for added and modified files', () => {
    const html = renderToString(
      <PreviewFileTree
        files={filesFixture}
        isLoading={false}
        selectedFilePath={null}
        onSelectFile={() => undefined}
        fileDiffByPath={fileDiffByPath}
      />,
    )

    expect(html).toContain('preview-tree-change-dot preview-tree-change-dot-added')
    expect(html).toContain('preview-tree-change-dot preview-tree-change-dot-modified')
  })

  it('keeps selected row markup stable between renders', () => {
    const firstHtml = renderToString(
      <PreviewFileTree
        files={filesFixture}
        isLoading={false}
        selectedFilePath="src/main/java/com/example/DemoApplication.java"
        onSelectFile={() => undefined}
        fileDiffByPath={fileDiffByPath}
      />,
    )

    const secondHtml = renderToString(
      <PreviewFileTree
        files={filesFixture}
        isLoading={false}
        selectedFilePath="src/main/java/com/example/DemoApplication.java"
        onSelectFile={() => undefined}
        fileDiffByPath={fileDiffByPath}
      />,
    )

    expect(firstHtml).toContain('preview-tree-row preview-tree-row-active')
    expect(secondHtml).toContain('preview-tree-row preview-tree-row-active')
  })
})
