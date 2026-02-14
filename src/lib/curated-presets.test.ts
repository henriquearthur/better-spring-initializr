import { describe, expect, it } from 'vitest'

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
  it('adds preset dependencies and de-duplicates selections', () => {
    const result = applyCuratedPreset(['web', 'actuator', 'web'], 'rest-api-postgres')

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.nextSelectedDependencyIds).toEqual([
      'web',
      'actuator',
      'validation',
      'data-jpa',
      'postgresql',
      'flyway',
    ])
  })

  it('returns PRESET_NOT_FOUND and normalized current selection for unknown preset', () => {
    const result = applyCuratedPreset(['  web  ', '', 'web'], 'unknown')

    expect(result).toEqual({
      ok: false,
      code: 'PRESET_NOT_FOUND',
      nextSelectedDependencyIds: ['web'],
    })
  })
})
