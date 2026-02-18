import { renderToString } from 'react-dom/server'
import type { ThemedToken } from 'shiki'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CodePreviewEngineResult } from '@/features/preview/hooks/use-code-preview-engine'
import type { PreviewFileDiff } from '@/features/preview/model/preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'

const { useCodePreviewEngineMock } = vi.hoisted(() => ({
  useCodePreviewEngineMock: vi.fn(),
}))

vi.mock('@/features/preview/hooks/use-code-preview-engine', () => ({
  useCodePreviewEngine: useCodePreviewEngineMock,
}))

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        size: 26,
        start: index * 26,
      })),
    getTotalSize: () => count * 26,
  }),
}))

import { FileContentViewer } from './file-content-viewer'

const fileFixture: PreviewSnapshotFile = {
  path: 'src/main/java/com/example/DemoApplication.java',
  hash: 'demo-file',
  binary: false,
  size: 120,
  content: 'class Demo {}',
}

function buildEngineResult(
  partial: Partial<CodePreviewEngineResult> = {},
): CodePreviewEngineResult {
  return {
    lines: ['class Demo {}'],
    tokenLines: null,
    status: 'running',
    message: undefined,
    language: 'java',
    ...partial,
  }
}

describe('FileContentViewer', () => {
  beforeEach(() => {
    useCodePreviewEngineMock.mockReset()
  })

  it('renders plain text immediately while highlighting is running', () => {
    useCodePreviewEngineMock.mockReturnValue(buildEngineResult())

    const html = renderToString(
      <FileContentViewer
        file={fileFixture}
        isLoading={false}
        diff={null}
      />,
    )

    expect(html).toContain('data-testid="preview-code-pane"')
    expect(html).toContain('data-testid="preview-gutter-mask"')
    expect(html).toContain('class Demo {}')
    expect(html).toContain('Highlighting...')
  })

  it('keeps the code pane container after highlight completion', () => {
    const highlightedTokens = [[{ content: 'class Demo {}', offset: 0 } as ThemedToken]]

    useCodePreviewEngineMock.mockReturnValue(buildEngineResult({ status: 'running' }))
    const beforeHtml = renderToString(
      <FileContentViewer
        file={fileFixture}
        isLoading={false}
        diff={null}
      />,
    )

    useCodePreviewEngineMock.mockReturnValue(
      buildEngineResult({ status: 'done', tokenLines: highlightedTokens }),
    )
    const afterHtml = renderToString(
      <FileContentViewer
        file={fileFixture}
        isLoading={false}
        diff={null}
      />,
    )

    expect(beforeHtml).toContain('data-testid="preview-code-pane"')
    expect(afterHtml).toContain('data-testid="preview-code-pane"')
    expect(afterHtml).not.toContain('Highlighting...')
    expect(afterHtml).toContain('class Demo {}')
  })

  it('shows unsupported files as plain text without warning banners', () => {
    useCodePreviewEngineMock.mockReturnValue(
      buildEngineResult({
        language: null,
        status: 'skipped',
        message: undefined,
        lines: ['*.log'],
      }),
    )

    const html = renderToString(
      <FileContentViewer
        file={{ ...fileFixture, path: '.gitignore', content: '*.log' }}
        isLoading={false}
        diff={null}
      />,
    )

    expect(html).toContain('*.log')
    expect(html).not.toContain('Syntax highlighting unavailable. Showing plain text.')
  })

  it('renders an opaque line-number gutter for added lines', () => {
    useCodePreviewEngineMock.mockReturnValue(buildEngineResult({ status: 'done' }))
    const diff: PreviewFileDiff = {
      path: fileFixture.path,
      changeType: 'modified',
      binary: false,
      lineDiff: {
        added: [1],
        removed: [],
      },
    }

    const html = renderToString(
      <FileContentViewer
        file={fileFixture}
        isLoading={false}
        diff={diff}
      />,
    )

    expect(html).toContain('sticky left-0 z-30 h-full border-r bg-[var(--card)]')
  })
})
