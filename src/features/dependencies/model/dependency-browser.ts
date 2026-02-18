import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'

export type DependencyGroup = {
  category: string
  dependencies: InitializrDependency[]
}

export function groupDependenciesByCategory(
  dependencies: InitializrDependency[],
): DependencyGroup[] {
  const grouped = new Map<string, InitializrDependency[]>()
  const compareAlphabetically = (left: string, right: string) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' })

  for (const dependency of dependencies) {
    const existing = grouped.get(dependency.group)

    if (existing) {
      existing.push(dependency)
      continue
    }

    grouped.set(dependency.group, [dependency])
  }

  return Array.from(grouped.entries())
    .sort(([leftCategory], [rightCategory]) => compareAlphabetically(leftCategory, rightCategory))
    .map(([category, categoryDependencies]) => ({
      category,
      dependencies: [...categoryDependencies].sort((leftDependency, rightDependency) => {
        const byName = compareAlphabetically(leftDependency.name, rightDependency.name)

        if (byName !== 0) {
          return byName
        }

        return compareAlphabetically(leftDependency.id, rightDependency.id)
      }),
    }))
}

export function filterDependencyGroups(
  groups: DependencyGroup[],
  searchTerm: string,
): DependencyGroup[] {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()

  if (!normalizedSearch) {
    return groups
  }

  return groups
    .map((group) => {
      const matchingDependencies = group.dependencies.filter((dependency) => {
        const nameMatches = dependency.name.toLocaleLowerCase().includes(normalizedSearch)
        const descriptionMatches = (dependency.description ?? '')
          .toLocaleLowerCase()
          .includes(normalizedSearch)

        return nameMatches || descriptionMatches
      })

      return {
        ...group,
        dependencies: matchingDependencies,
      }
    })
    .filter((group) => group.dependencies.length > 0)
}

export function toggleDependencySelection(
  selectedDependencyIds: string[],
  dependencyId: string,
): string[] {
  if (selectedDependencyIds.includes(dependencyId)) {
    return selectedDependencyIds.filter((selectedId) => selectedId !== dependencyId)
  }

  return [...selectedDependencyIds, dependencyId]
}

export function replaceDependencySelection(dependencyIds: string[]): string[] {
  return Array.from(
    new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)),
  )
}
