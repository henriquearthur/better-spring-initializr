import { useState } from 'react'

import {
  type DependencyGroup,
  filterDependencyGroups,
  groupDependenciesByCategory,
  replaceDependencySelection,
  toggleDependencySelection,
} from '@/features/dependencies/model/dependency-browser'
import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'

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

  const groupedDependencyCategories = groupDependenciesByCategory(dependencies)

  const filteredDependencyCategories = filterDependencyGroups(groupedDependencyCategories, searchTerm)

  const toggleDependency = (dependencyId: string) => {
    setSelectedDependencyIds((currentSelection) =>
      toggleDependencySelection(currentSelection, dependencyId),
    )
  }

  const setSelectedDependencies = (dependencyIds: string[]) => {
    setSelectedDependencyIds(replaceDependencySelection(dependencyIds))
  }

  const clearSelectedDependencies = () => {
    setSelectedDependencyIds([])
  }

  const isDependencySelected = (dependencyId: string) => selectedDependencyIds.includes(dependencyId)

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
