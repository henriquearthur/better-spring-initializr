import { describe, expect, it } from 'vitest'

import type { InitializrDependency } from '@/server/lib/initializr-client'
import {
  CURATED_PRESETS,
  applyCuratedPreset,
  getCuratedPresetById,
  loadCuratedPresetSourcesFromModules,
  resolveCuratedPresets,
} from './curated-presets'

function createDependency(id: string, name: string): InitializrDependency {
  return {
    id,
    name,
    default: false,
    group: 'Test',
  }
}

describe('curated preset catalog', () => {
  it('exposes a deterministic local preset list', () => {
    expect(CURATED_PRESETS).toHaveLength(6)
    expect(CURATED_PRESETS.map((preset) => preset.id)).toEqual([
      'rest-api-postgres',
      'rest-api-mysql',
      'secure-rest-api',
      'event-driven-kafka',
      'event-driven-rabbitmq',
      'api-gateway-reactive',
    ])
  })

  it('includes actuator and devtools in every preset', () => {
    for (const preset of CURATED_PRESETS) {
      expect(preset.dependencyIds).toContain('actuator')
      expect(preset.dependencyIds).toContain('devtools')
    }
  })

  it('finds preset by id and returns null for unknown id', () => {
    expect(getCuratedPresetById('rest-api-postgres')?.name).toBe('REST API + PostgreSQL')
    expect(getCuratedPresetById('missing-preset')).toBeNull()
  })
})

describe('loadCuratedPresetSourcesFromModules', () => {
  it('sorts curated presets by sortOrder and id', () => {
    const loaded = loadCuratedPresetSourcesFromModules({
      '../presets/zeta.json': {
        id: 'zeta',
        name: 'Zeta',
        intent: 'Zeta intent',
        tags: ['A'],
        dependencyIds: ['web'],
        sortOrder: 30,
      },
      '../presets/alpha.json': {
        id: 'alpha',
        name: 'Alpha',
        intent: 'Alpha intent',
        tags: ['B'],
        dependencyIds: ['data-jpa'],
        sortOrder: 10,
      },
      '../presets/beta.json': {
        id: 'beta',
        name: 'Beta',
        intent: 'Beta intent',
        tags: ['C'],
        dependencyIds: ['amqp'],
        sortOrder: 10,
      },
    })

    expect(loaded.map((preset) => preset.id)).toEqual(['alpha', 'beta', 'zeta'])
  })

  it('throws when duplicate preset ids exist', () => {
    expect(() =>
      loadCuratedPresetSourcesFromModules({
        '../presets/a.json': {
          id: 'duplicate',
          name: 'A',
          intent: 'A intent',
          tags: ['A'],
          dependencyIds: ['web'],
          sortOrder: 10,
        },
        '../presets/b.json': {
          id: 'duplicate',
          name: 'B',
          intent: 'B intent',
          tags: ['B'],
          dependencyIds: ['data-jpa'],
          sortOrder: 20,
        },
      }),
    ).toThrow('Duplicate curated preset id "duplicate".')
  })

  it('throws when optional dependency resolver has invalid fallback regex', () => {
    expect(() =>
      loadCuratedPresetSourcesFromModules({
        '../presets/a.json': {
          id: 'invalid-regex',
          name: 'Invalid Regex',
          intent: 'Invalid resolver regex',
          tags: ['A'],
          dependencyIds: ['web'],
          sortOrder: 10,
          optionalDependencyResolvers: [
            {
              strategy: 'first-available',
              candidates: ['swagger'],
              fallbackNamePattern: '[invalid',
            },
          ],
        },
      }),
    ).toThrow('fallbackNamePattern must be a valid regular expression.')
  })
})

describe('resolveCuratedPresets', () => {
  it('keeps base dependencies when no swagger-compatible dependency exists', () => {
    const resolved = resolveCuratedPresets([
      createDependency('web', 'Spring Web'),
      createDependency('data-jpa', 'Spring Data JPA'),
      createDependency('postgresql', 'PostgreSQL Driver'),
    ])

    const restApiPostgresPreset = getCuratedPresetById('rest-api-postgres', resolved)

    expect(restApiPostgresPreset).not.toBeNull()
    expect(restApiPostgresPreset?.dependencyIds).toEqual([
      'web',
      'validation',
      'data-jpa',
      'postgresql',
      'flyway',
      'actuator',
      'devtools',
    ])
  })

  it('adds swagger dependency to REST API + PostgreSQL when compatible id exists', () => {
    const resolved = resolveCuratedPresets([
      createDependency('swagger', 'Swagger UI'),
      createDependency(
        'springdoc-openapi-starter-webmvc-ui',
        'OpenAPI UI Starter',
      ),
      createDependency('web', 'Spring Web'),
    ])

    const restApiPostgresPreset = getCuratedPresetById('rest-api-postgres', resolved)

    expect(restApiPostgresPreset?.dependencyIds).toContain(
      'springdoc-openapi-starter-webmvc-ui',
    )
    expect(restApiPostgresPreset?.dependencyIds).not.toContain('swagger')
  })

  it('adds swagger dependency by name fallback when id does not match candidates', () => {
    const resolved = resolveCuratedPresets([
      createDependency('custom-docs', 'Swagger Tools'),
      createDependency('web', 'Spring Web'),
    ])

    const restApiPostgresPreset = getCuratedPresetById('rest-api-postgres', resolved)

    expect(restApiPostgresPreset?.dependencyIds).toContain('custom-docs')
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
      'devtools',
    ])
  })

  it('applies dependencies from resolved preset catalog', () => {
    const resolved = resolveCuratedPresets([
      createDependency('springdoc-openapi-starter-webmvc-ui', 'OpenAPI UI Starter'),
      createDependency('web', 'Spring Web'),
    ])
    const result = applyCuratedPreset(['web'], 'rest-api-postgres', resolved)

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.nextSelectedDependencyIds).toContain('springdoc-openapi-starter-webmvc-ui')
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
