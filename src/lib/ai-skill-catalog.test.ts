import { describe, expect, it } from 'vitest'

import {
  AI_SKILL_CATALOG_SOURCES,
  loadAiSkillSourcesFromModules,
} from './ai-skill-catalog'

describe('ai skill catalog', () => {
  it('exposes a deterministic local skills list', () => {
    expect(AI_SKILL_CATALOG_SOURCES).toHaveLength(5)
    expect(AI_SKILL_CATALOG_SOURCES.map((skill) => skill.id)).toEqual([
      'skill-java-code-review',
      'skill-spring-boot-patterns',
      'skill-jpa-patterns',
      'skill-test-quality',
      'skill-security-audit',
    ])
  })
})

describe('loadAiSkillSourcesFromModules', () => {
  it('sorts skills by sortOrder and id', () => {
    const loaded = loadAiSkillSourcesFromModules({
      '../skills/gamma.json': {
        id: 'skill-gamma',
        label: 'Gamma',
        description: 'Gamma description',
        directoryName: 'gamma',
        sortOrder: 30,
      },
      '../skills/beta.json': {
        id: 'skill-beta',
        label: 'Beta',
        description: 'Beta description',
        directoryName: 'beta',
        sortOrder: 10,
      },
      '../skills/alpha.json': {
        id: 'skill-alpha',
        label: 'Alpha',
        description: 'Alpha description',
        directoryName: 'alpha',
        sortOrder: 10,
      },
    })

    expect(loaded.map((skill) => skill.id)).toEqual([
      'skill-alpha',
      'skill-beta',
      'skill-gamma',
    ])
  })

  it('throws when duplicate ids exist', () => {
    expect(() =>
      loadAiSkillSourcesFromModules({
        '../skills/one.json': {
          id: 'skill-duplicate',
          label: 'One',
          description: 'One description',
          directoryName: 'one',
          sortOrder: 10,
        },
        '../skills/two.json': {
          id: 'skill-duplicate',
          label: 'Two',
          description: 'Two description',
          directoryName: 'two',
          sortOrder: 20,
        },
      }),
    ).toThrow('Duplicate AI skill id "skill-duplicate".')
  })

  it('throws when required fields are missing', () => {
    expect(() =>
      loadAiSkillSourcesFromModules({
        '../skills/missing-description.json': {
          id: 'skill-missing-description',
          label: 'Missing description',
          directoryName: 'missing-description',
          sortOrder: 10,
        },
      }),
    ).toThrow('description must be a string.')
  })

  it('throws when unsupported fields are present', () => {
    expect(() =>
      loadAiSkillSourcesFromModules({
        '../skills/invalid-field.json': {
          id: 'skill-invalid-field',
          label: 'Invalid field',
          description: 'Invalid field description',
          directoryName: 'invalid-field',
          sortOrder: 10,
          pathHint: '.agents/skills/invalid-field/SKILL.md',
        },
      }),
    ).toThrow('contains unsupported key "pathHint".')
  })

  it('throws when the catalog is empty', () => {
    expect(() => loadAiSkillSourcesFromModules({})).toThrow(
      'AI skill catalog is empty. Add JSON files under src/skills/.',
    )
  })
})
