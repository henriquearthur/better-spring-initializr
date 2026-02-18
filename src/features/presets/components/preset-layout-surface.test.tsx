import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { CURATED_PRESETS } from '@/features/presets/model/curated-presets'
import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'

import { PresetLayoutSurface } from './preset-layout-surface'

const availableDependenciesFixture: InitializrDependency[] = [
  {
    id: 'web',
    name: 'Spring Web',
    default: false,
    group: 'Web',
  },
  {
    id: 'validation',
    name: 'Validation',
    default: false,
    group: 'Core',
  },
  {
    id: 'data-jpa',
    name: 'Spring Data JPA',
    default: false,
    group: 'SQL',
  },
]

describe('PresetLayoutSurface', () => {
  it('renders hero strip without an empty-state card by default', () => {
    const html = renderToString(
      <PresetLayoutSurface
        presets={CURATED_PRESETS}
        selectedPresetId={null}
        onSelectPreset={vi.fn()}
        availableDependencies={availableDependenciesFixture}
        metadataAvailable
        selectedDependencyCount={2}
      />,
    )

    expect(html).toContain('data-testid="preset-surface-hero-strip"')
    expect(html).not.toContain('No preset selected')
    expect(html).not.toContain('Apply preset')
    expect(html).not.toContain('mt-4 rounded-xl border bg-[var(--card)] p-3')
  })

  it('uses the compact details label for an active preset', () => {
    const html = renderToString(
      <PresetLayoutSurface
        presets={CURATED_PRESETS}
        selectedPresetId={CURATED_PRESETS[0]?.id ?? null}
        onSelectPreset={vi.fn()}
        availableDependencies={availableDependenciesFixture}
        metadataAvailable
        selectedDependencyCount={2}
      />,
    )

    expect(html).toContain('Details')
    expect(html).not.toContain('Inspect details')
  })

  it('shows a fallback card when no curated presets are available', () => {
    const html = renderToString(
      <PresetLayoutSurface
        presets={[]}
        selectedPresetId={null}
        onSelectPreset={vi.fn()}
        availableDependencies={availableDependenciesFixture}
        metadataAvailable
        selectedDependencyCount={0}
      />,
    )

    expect(html).toContain('Curated Presets')
    expect(html).toContain('Presets are unavailable right now.')
  })
})
