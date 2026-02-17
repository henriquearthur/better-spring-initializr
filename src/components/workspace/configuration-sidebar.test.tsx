import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_PROJECT_CONFIG } from '@/lib/project-config'

const { useEffectMock, useInitializrMetadataMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn(),
  useInitializrMetadataMock: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    useEffect: useEffectMock,
  }
})

vi.mock('@/hooks/use-initializr-metadata', () => ({
  useInitializrMetadata: useInitializrMetadataMock,
}))

import { ConfigurationSidebar } from './configuration-sidebar'

describe('ConfigurationSidebar reset button visibility', () => {
  beforeEach(() => {
    useEffectMock.mockReset()
    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      callback()
    })
    useInitializrMetadataMock.mockReset()
    useInitializrMetadataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
  })

  it('does not render reset button when showReset is false', () => {
    const html = renderToString(
      <ConfigurationSidebar
        config={DEFAULT_PROJECT_CONFIG}
        onConfigChange={vi.fn()}
        onFieldChange={vi.fn()}
        onResetConfig={vi.fn()}
        showReset={false}
      />,
    )

    expect(html).not.toContain('>Reset<')
  })

  it('renders reset button when showReset is true', () => {
    const html = renderToString(
      <ConfigurationSidebar
        config={DEFAULT_PROJECT_CONFIG}
        onConfigChange={vi.fn()}
        onFieldChange={vi.fn()}
        onResetConfig={vi.fn()}
        showReset
      />,
    )

    expect(html).toContain('>Reset<')
  })

  it('renders build settings content expanded by default', () => {
    const html = renderToString(
      <ConfigurationSidebar
        config={DEFAULT_PROJECT_CONFIG}
        onConfigChange={vi.fn()}
        onFieldChange={vi.fn()}
        onResetConfig={vi.fn()}
        showReset={false}
      />,
    )

    expect(html).toContain('Java Version')
    expect(html).toContain('Spring Boot')
  })
})

describe('ConfigurationSidebar metadata reconciliation', () => {
  beforeEach(() => {
    useEffectMock.mockReset()
    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      callback()
    })
    useInitializrMetadataMock.mockReset()
  })

  it('applies fallback metadata versions without persisting to URL', async () => {
    useInitializrMetadataMock.mockReturnValue({
      data: {
        ok: true,
        metadata: {
          dependencies: [],
          javaVersions: [
            { id: DEFAULT_PROJECT_CONFIG.javaVersion, name: 'Java 21', default: true },
          ],
          springBootVersions: [{ id: '3.6.0', name: '3.6.0', default: true }],
        },
        source: 'upstream',
        cache: {
          status: 'hit',
          cachedAt: 1,
          expiresAt: 2,
          ttlMs: 300000,
        },
      },
      isLoading: false,
      isError: false,
    })

    const onConfigChange = vi.fn()

    renderToString(
      <ConfigurationSidebar
        config={{
          ...DEFAULT_PROJECT_CONFIG,
          springBootVersion: '0.0.1',
        }}
        onConfigChange={onConfigChange}
        onFieldChange={vi.fn()}
        onResetConfig={vi.fn()}
        showReset={false}
      />,
    )

    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        springBootVersion: '3.6.0',
        javaVersion: DEFAULT_PROJECT_CONFIG.javaVersion,
      }),
      { persistToUrl: false },
    )
  })
})
