import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_PROJECT_CONFIG } from '@/lib/project-config'

const { useInitializrMetadataMock } = vi.hoisted(() => ({
  useInitializrMetadataMock: vi.fn(),
}))

vi.mock('@/hooks/use-initializr-metadata', () => ({
  useInitializrMetadata: useInitializrMetadataMock,
}))

import { ConfigurationSidebar } from './configuration-sidebar'

describe('ConfigurationSidebar reset button visibility', () => {
  beforeEach(() => {
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
})
