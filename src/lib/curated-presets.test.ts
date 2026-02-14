import { describe, expect, it } from 'vitest'

import { DEFAULT_PROJECT_CONFIG } from './project-config'
import {
  CURATED_PRESETS,
  applyCuratedPreset,
  getCuratedPresetById,
} from './curated-presets'

describe('curated preset catalog', () => {
  it('exposes a deterministic local preset list', () => {
    expect(CURATED_PRESETS).toHaveLength(3)
    expect(CURATED_PRESETS.map((preset) => preset.id)).toEqual([
      'rest-api-postgres',
      'reactive-microservice',
      'batch-worker',
    ])
  })

  it('finds preset by id and returns null for unknown id', () => {
    expect(getCuratedPresetById('rest-api-postgres')?.name).toBe('REST API + PostgreSQL')
    expect(getCuratedPresetById('missing-preset')).toBeNull()
  })
})

describe('applyCuratedPreset', () => {
  it('merges preset config overrides and de-duplicates dependencies', () => {
    const result = applyCuratedPreset(
      {
        config: {
          ...DEFAULT_PROJECT_CONFIG,
          group: 'dev.acme',
          artifact: 'legacy-service',
        },
        selectedDependencyIds: ['web', 'actuator', 'web'],
      },
      'rest-api-postgres',
    )

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.next.config.group).toBe('dev.acme')
    expect(result.next.config.artifact).toBe('api-service')
    expect(result.next.config.buildTool).toBe('maven-project')
    expect(result.next.selectedDependencyIds).toEqual([
      'web',
      'actuator',
      'validation',
      'data-jpa',
      'postgresql',
      'flyway',
    ])
  })

  it('returns PRESET_NOT_FOUND and normalized current snapshot for unknown preset', () => {
    const result = applyCuratedPreset(
      {
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['  web  ', '', 'web'],
      },
      'unknown',
    )

    expect(result).toEqual({
      ok: false,
      code: 'PRESET_NOT_FOUND',
      next: {
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
      },
    })
  })
})
