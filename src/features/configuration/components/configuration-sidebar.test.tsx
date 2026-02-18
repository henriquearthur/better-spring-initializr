import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_PROJECT_CONFIG,
  type MetadataDrivenConfigOptions,
} from '@/shared/lib/project-config'

const { useEffectMock } = vi.hoisted(() => ({
  useEffectMock: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    useEffect: useEffectMock,
  }
})

import { ConfigurationSidebar } from './configuration-sidebar'

const metadataDrivenOptionsFixture: MetadataDrivenConfigOptions = {
  javaVersions: [{ value: DEFAULT_PROJECT_CONFIG.javaVersion, label: 'Java 21' }],
  springBootVersions: [{ value: '3.6.0', label: '3.6.0' }],
  defaults: {
    javaVersion: DEFAULT_PROJECT_CONFIG.javaVersion,
    springBootVersion: '3.6.0',
  },
}

describe('ConfigurationSidebar reset button visibility', () => {
  beforeEach(() => {
    useEffectMock.mockReset()
    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      callback()
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
        metadataDrivenOptions={metadataDrivenOptionsFixture}
        metadataUnavailable={false}
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
        metadataDrivenOptions={metadataDrivenOptionsFixture}
        metadataUnavailable={false}
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
        metadataDrivenOptions={metadataDrivenOptionsFixture}
        metadataUnavailable={false}
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
  })

  it('applies fallback metadata versions without persisting to URL', () => {
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
        metadataDrivenOptions={metadataDrivenOptionsFixture}
        metadataUnavailable={false}
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
