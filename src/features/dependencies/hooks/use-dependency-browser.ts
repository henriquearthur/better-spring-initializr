import { useCallback, useMemo, useState } from 'react'

import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'
import {
  filterDependencyGroups,
  groupDependenciesByCategory,
  replaceDependencySelection,
  toggleDependencySelection,
  type DependencyGroup,
} from '@/features/dependencies/model/dependency-browser'

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
