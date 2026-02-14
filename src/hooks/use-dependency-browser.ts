import { useCallback, useMemo, useState } from 'react'

import type { InitializrDependency } from '@/server/lib/initializr-client'

export type DependencyGroup = {
  category: string
  dependencies: InitializrDependency[]
}

export type UseDependencyBrowserResult = {
  groupedDependencyCategories: DependencyGroup[]
  filteredDependencyCategories: DependencyGroup[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedDependencyIds: string[]
  selectedDependencyCount: number
  toggleDependency: (dependencyId: string) => void
  setSelectedDependencyIds: (dependencyIds: string[]) => void
  clearSelectedDependencies: () => void
  isDependencySelected: (dependencyId: string) => boolean
}

export function groupDependenciesByCategory(
  dependencies: InitializrDependency[],
): DependencyGroup[] {
  const grouped = new Map<string, InitializrDependency[]>()

  for (const dependency of dependencies) {
    const existing = grouped.get(dependency.group)

    if (existing) {
      existing.push(dependency)
      continue
    }

    grouped.set(dependency.group, [dependency])
  }

  return Array.from(grouped.entries()).map(([category, categoryDependencies]) => ({
    category,
    dependencies: categoryDependencies,
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
  return Array.from(new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)))
}

export function useDependencyBrowser(
  dependencies: InitializrDependency[],
): UseDependencyBrowserResult {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<string[]>([])

  const groupedDependencyCategories = useMemo(
    () => groupDependenciesByCategory(dependencies),
    [dependencies],
  )

  const filteredDependencyCategories = useMemo(
    () => filterDependencyGroups(groupedDependencyCategories, searchTerm),
    [groupedDependencyCategories, searchTerm],
  )

  const toggleDependency = useCallback((dependencyId: string) => {
    setSelectedDependencyIds((currentSelection) =>
      toggleDependencySelection(currentSelection, dependencyId),
    )
  }, [])

  const setSelectedDependencies = useCallback((dependencyIds: string[]) => {
    setSelectedDependencyIds(replaceDependencySelection(dependencyIds))
  }, [])

  const clearSelectedDependencies = useCallback(() => {
    setSelectedDependencyIds([])
  }, [])

  const isDependencySelected = useCallback(
    (dependencyId: string) => selectedDependencyIds.includes(dependencyId),
    [selectedDependencyIds],
  )

  return {
    groupedDependencyCategories,
    filteredDependencyCategories,
    searchTerm,
    setSearchTerm,
    selectedDependencyIds,
    selectedDependencyCount: selectedDependencyIds.length,
    toggleDependency,
    setSelectedDependencyIds: setSelectedDependencies,
    clearSelectedDependencies,
    isDependencySelected,
  }
}
