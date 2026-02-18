import { describe, expect, it } from 'vitest'

import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'
import {
  filterDependencyGroups,
  groupDependenciesByCategory,
  replaceDependencySelection,
  toggleDependencySelection,
} from '@/features/dependencies/model/dependency-browser'

const dependencyFixture: InitializrDependency[] = [
  {
    id: 'web',
    name: 'Spring Web',
    description: 'Build web APIs',
    default: false,
    group: 'Web',
  },
  {
    id: 'graphql',
    name: 'Spring for GraphQL',
    description: 'GraphQL support',
    default: false,
    group: 'Web',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL Driver',
    description: 'JDBC and R2DBC support for Postgres',
    default: false,
    group: 'SQL',
  },
  {
    id: 'oauth2-client',
    name: 'OAuth2 Client',
    description: 'Client-side OAuth and OpenID Connect',
    default: false,
    group: 'Security',
  },
]

describe('groupDependenciesByCategory', () => {
  it('groups dependencies by category and sorts categories/dependencies alphabetically', () => {
    const groups = groupDependenciesByCategory(dependencyFixture)

    expect(groups.map((group) => group.category)).toEqual(['Security', 'SQL', 'Web'])
    expect(groups[2]?.dependencies.map((dependency) => dependency.id)).toEqual(['graphql', 'web'])
  })
})

describe('filterDependencyGroups', () => {
  it('filters categories by dependency name and keeps only matching cards', () => {
    const groups = groupDependenciesByCategory(dependencyFixture)
    const filtered = filterDependencyGroups(groups, 'graph')

    expect(filtered).toEqual([
      {
        category: 'Web',
        dependencies: [
          expect.objectContaining({
            id: 'graphql',
          }),
        ],
      },
    ])
  })

  it('matches dependency description case-insensitively', () => {
    const groups = groupDependenciesByCategory(dependencyFixture)
    const filtered = filterDependencyGroups(groups, 'OPENid')

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.category).toBe('Security')
    expect(filtered[0]?.dependencies[0]?.id).toBe('oauth2-client')
  })
})

describe('toggleDependencySelection', () => {
  it('adds, removes, and clears dependency selection deterministically', () => {
    const selectedOnce = toggleDependencySelection([], 'web')
    const selectedTwice = toggleDependencySelection(selectedOnce, 'graphql')
    const unselected = toggleDependencySelection(selectedTwice, 'web')
    const cleared: string[] = []

    expect(selectedOnce).toEqual(['web'])
    expect(selectedTwice).toEqual(['web', 'graphql'])
    expect(unselected).toEqual(['graphql'])
    expect(cleared).toEqual([])
  })
})

describe('replaceDependencySelection', () => {
  it('normalizes and de-duplicates dependency ids while preserving first-seen order', () => {
    expect(replaceDependencySelection([' web ', '', 'actuator', 'web', 'data-jpa'])).toEqual([
      'web',
      'actuator',
      'data-jpa',
    ])
  })
})
