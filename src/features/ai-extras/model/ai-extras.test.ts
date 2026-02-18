import { describe, expect, it } from 'vitest'

import {
  AI_SKILL_OPTIONS,
  areAllAiPowerUpOptionsEnabled,
  DEFAULT_AGENTS_MD_PREFERENCES,
  getAllAiExtraIds,
  isAllAgentsMdGuidanceEnabled,
  setAllAgentsMdPreferences,
} from './ai-extras'

describe('ai extras bulk selection helpers', () => {
  it('returns every selectable ai extra id including agents-md and all skills', () => {
    const allAiExtraIds = getAllAiExtraIds()

    expect(allAiExtraIds).toContain('agents-md')

    for (const skillOption of AI_SKILL_OPTIONS) {
      expect(allAiExtraIds).toContain(skillOption.id)
    }
  })

  it('detects when all AGENTS guidance preferences are enabled', () => {
    expect(isAllAgentsMdGuidanceEnabled(DEFAULT_AGENTS_MD_PREFERENCES)).toBe(true)
    expect(
      isAllAgentsMdGuidanceEnabled({
        ...DEFAULT_AGENTS_MD_PREFERENCES,
        includeRunRelevantTestsGuidance: false,
      }),
    ).toBe(false)
  })

  it('returns true only when all extras and all guidance preferences are enabled', () => {
    const allAiExtraIds = getAllAiExtraIds()

    expect(
      areAllAiPowerUpOptionsEnabled(allAiExtraIds, DEFAULT_AGENTS_MD_PREFERENCES),
    ).toBe(true)

    expect(
      areAllAiPowerUpOptionsEnabled(
        allAiExtraIds.slice(1),
        DEFAULT_AGENTS_MD_PREFERENCES,
      ),
    ).toBe(false)

    expect(
      areAllAiPowerUpOptionsEnabled(allAiExtraIds, {
        ...DEFAULT_AGENTS_MD_PREFERENCES,
        includeConventionalCommitsGuidance: false,
      }),
    ).toBe(false)
  })

  it('builds preferences with all flags set to the same boolean value', () => {
    expect(setAllAgentsMdPreferences(true)).toEqual({
      includeFeatureBranchesGuidance: true,
      includeConventionalCommitsGuidance: true,
      includePullRequestsGuidance: true,
      includeRunRelevantTestsGuidance: true,
      includeTaskScopeDisciplineGuidance: true,
    })

    expect(setAllAgentsMdPreferences(false)).toEqual({
      includeFeatureBranchesGuidance: false,
      includeConventionalCommitsGuidance: false,
      includePullRequestsGuidance: false,
      includeRunRelevantTestsGuidance: false,
      includeTaskScopeDisciplineGuidance: false,
    })
  })
})
