import { useState } from 'react'

import {
  type AgentsMdGuidanceId,
  type AgentsMdPreferences,
  type AiExtraId,
  type AiExtrasTarget,
  type AiSkillExtraId,
  areAllAiPowerUpOptionsEnabled,
  DEFAULT_AGENTS_MD_PREFERENCES,
  DEFAULT_AI_EXTRAS_TARGET,
  getAgentsMdPreferenceIdsByGuidance,
  getAllAiExtraIds,
  normalizeAgentsMdPreferences,
  normalizeSelectedAiExtraIds,
  setAllAgentsMdPreferences,
} from '@/features/ai-extras/model/ai-extras'

export type AiExtrasState = {
  selectedAiExtraIds: AiExtraId[]
  aiExtrasTarget: AiExtrasTarget
  agentsMdPreferences: AgentsMdPreferences
  setSelectedAiExtraIds: React.Dispatch<React.SetStateAction<AiExtraId[]>>
  setAgentsMdPreferences: React.Dispatch<React.SetStateAction<AgentsMdPreferences>>
  setAiExtrasTarget: React.Dispatch<React.SetStateAction<AiExtrasTarget>>
  toggleAgentsMdEnabled: () => void
  toggleAiSkill: (skillId: AiSkillExtraId) => void
  toggleAllAiPowerUp: () => void
  toggleAgentsMdGuidance: (guidanceId: AgentsMdGuidanceId) => void
  toggleAgentsMdPreference: (preferenceId: keyof AgentsMdPreferences) => void
  changeAiExtrasTarget: (nextTarget: AiExtrasTarget) => void
}

export function useAiExtrasState(): AiExtrasState {
  const [selectedAiExtraIds, setSelectedAiExtraIds] = useState<AiExtraId[]>([])
  const [aiExtrasTarget, setAiExtrasTarget] = useState<AiExtrasTarget>(
    DEFAULT_AI_EXTRAS_TARGET,
  )
  const [agentsMdPreferences, setAgentsMdPreferences] = useState<AgentsMdPreferences>(
    DEFAULT_AGENTS_MD_PREFERENCES,
  )

  const toggleAgentsMdEnabled = () => {
    setSelectedAiExtraIds((currentIds) => {
      if (currentIds.includes('agents-md')) {
        return currentIds.filter((currentId) => currentId !== 'agents-md')
      }

      return normalizeSelectedAiExtraIds([...currentIds, 'agents-md'])
    })
  }

  const toggleAiSkill = (skillId: AiSkillExtraId) => {
    setSelectedAiExtraIds((currentIds) => {
      if (currentIds.includes(skillId)) {
        return normalizeSelectedAiExtraIds(
          currentIds.filter((currentId) => currentId !== skillId),
        )
      }

      return normalizeSelectedAiExtraIds([...currentIds, skillId])
    })
  }

  const toggleAllAiPowerUp = () => {
    const allAiPowerUpSelected = areAllAiPowerUpOptionsEnabled(
      selectedAiExtraIds,
      agentsMdPreferences,
    )

    if (allAiPowerUpSelected) {
      setSelectedAiExtraIds([])
      setAgentsMdPreferences(setAllAgentsMdPreferences(false))
      return
    }

    setSelectedAiExtraIds(getAllAiExtraIds())
    setAgentsMdPreferences(setAllAgentsMdPreferences(true))
  }

  const toggleAgentsMdGuidance = (guidanceId: AgentsMdGuidanceId) => {
    const preferenceIds = getAgentsMdPreferenceIdsByGuidance(guidanceId)

    setAgentsMdPreferences((currentPreferences) => {
      const shouldEnable = preferenceIds.some((preferenceId) => !currentPreferences[preferenceId])
      const nextPreferences: Partial<AgentsMdPreferences> = { ...currentPreferences }

      for (const preferenceId of preferenceIds) {
        nextPreferences[preferenceId] = shouldEnable
      }

      return normalizeAgentsMdPreferences(nextPreferences)
    })
  }

  const toggleAgentsMdPreference = (preferenceId: keyof AgentsMdPreferences) => {
    setAgentsMdPreferences((currentPreferences) =>
      normalizeAgentsMdPreferences({
        ...currentPreferences,
        [preferenceId]: !currentPreferences[preferenceId],
      }),
    )
  }

  const changeAiExtrasTarget = (nextTarget: AiExtrasTarget) => {
    setAiExtrasTarget((currentTarget) =>
      currentTarget === nextTarget ? currentTarget : nextTarget,
    )
  }

  return {
    selectedAiExtraIds,
    aiExtrasTarget,
    agentsMdPreferences,
    setSelectedAiExtraIds,
    setAgentsMdPreferences,
    setAiExtrasTarget,
    toggleAgentsMdEnabled,
    toggleAiSkill,
    toggleAllAiPowerUp,
    toggleAgentsMdGuidance,
    toggleAgentsMdPreference,
    changeAiExtrasTarget,
  }
}
