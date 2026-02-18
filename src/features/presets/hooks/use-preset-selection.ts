import { useState } from 'react'

import {
  applyCuratedPreset,
  type CuratedPreset,
} from '@/features/presets/model/curated-presets'

export type PresetSelectionState = {
  selectedPresetId: string | null
  selectPreset: (presetId: string) => void
}

export function usePresetSelection(options: {
  resolvedPresets: CuratedPreset[]
  getSelectedDependencyIds: () => string[]
  setSelectedDependencyIds: (ids: string[]) => void
}): PresetSelectionState {
  const { resolvedPresets, getSelectedDependencyIds, setSelectedDependencyIds } = options
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [appliedPresetDependencyIds, setAppliedPresetDependencyIds] = useState<string[]>([])

  const selectPreset = (presetId: string) => {
    const currentSelectedDependencyIds = getSelectedDependencyIds()
    const appliedDependencySet = new Set(appliedPresetDependencyIds)
    const baseDependencySelection =
      appliedDependencySet.size === 0
        ? currentSelectedDependencyIds
        : currentSelectedDependencyIds.filter(
            (dependencyId) => !appliedDependencySet.has(dependencyId),
          )

    if (selectedPresetId === presetId) {
      setSelectedPresetId(null)
      setAppliedPresetDependencyIds([])
      setSelectedDependencyIds(baseDependencySelection)
      return
    }

    const result = applyCuratedPreset(baseDependencySelection, presetId, resolvedPresets)

    if (!result.ok) {
      return
    }

    const baseDependencySet = new Set(baseDependencySelection)
    const nextAppliedPresetDependencyIds = result.nextSelectedDependencyIds.filter(
      (dependencyId) => !baseDependencySet.has(dependencyId),
    )

    setSelectedPresetId(presetId)
    setAppliedPresetDependencyIds(nextAppliedPresetDependencyIds)
    setSelectedDependencyIds(result.nextSelectedDependencyIds)
  }

  return {
    selectedPresetId,
    selectPreset,
  }
}
