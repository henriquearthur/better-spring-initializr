import { describe, expect, it } from 'vitest'

import { AI_SKILL_OPTIONS } from './ai-extras'
import { DEFAULT_PROJECT_CONFIG } from './project-config'
import { decodeShareConfig, encodeShareConfig } from './share-config'

const primarySkill = AI_SKILL_OPTIONS[0]
const secondarySkill = AI_SKILL_OPTIONS[1]

if (!primarySkill || !secondarySkill) {
  throw new Error('Expected at least two AI skills in the catalog.')
}

describe('share config codec', () => {
  it('encodes and decodes a configuration snapshot deterministically', () => {
    const token = encodeShareConfig({
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
        artifact: 'petstore',
      },
      selectedDependencyIds: ['web', 'actuator', 'web', '  data-jpa  '],
      selectedAiExtraIds: [secondarySkill.id, 'agents-md', primarySkill.id],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: false,
        includeTaskScopeDisciplineGuidance: true,
      },
      aiExtrasTarget: 'claude',
    })

    const decoded = decodeShareConfig(token)

    expect(decoded).toEqual({
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
        artifact: 'petstore',
      },
      selectedDependencyIds: ['actuator', 'data-jpa', 'web'],
      selectedAiExtraIds: ['agents-md', primarySkill.id, secondarySkill.id],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: false,
        includeTaskScopeDisciplineGuidance: true,
      },
      aiExtrasTarget: 'claude',
    })
  })

  it('defaults ai extras fields for old share payloads', () => {
    const legacyToken = btoa(
      JSON.stringify({
        v: 1,
        config: {
          ...DEFAULT_PROJECT_CONFIG,
          artifact: 'legacy-demo',
        },
        selectedDependencyIds: ['web'],
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(legacyToken)).toEqual({
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        artifact: 'legacy-demo',
      },
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: true,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: true,
        includeTaskScopeDisciplineGuidance: true,
      },
      aiExtrasTarget: 'agents',
    })
  })

  it('returns null for malformed tokens', () => {
    expect(decodeShareConfig('@@not-valid-base64url@@')).toBeNull()
  })

  it('returns null for unsupported schema versions', () => {
    const unsupported = btoa(
      JSON.stringify({
        v: 999,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(unsupported)).toBeNull()
  })

  it('drops unknown ai extra ids while decoding', () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
        selectedAiExtraIds: ['skill-legacy-extra', primarySkill.id, 'agents-md'],
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(token)?.selectedAiExtraIds).toEqual([
      'agents-md',
      primarySkill.id,
    ])
  })

  it('defaults to agents target when decoded payload has unsupported target', () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
        aiExtrasTarget: 'custom-target',
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(token)?.aiExtrasTarget).toBe('agents')
  })

  it('keeps claude target when payload defines aiExtrasTarget', () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
        aiExtrasTarget: 'claude',
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(token)?.aiExtrasTarget).toBe('claude')
  })

  it('maps legacy aiAgentId to claude target when aiExtrasTarget is absent', () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
        aiAgentId: 'claude-code',
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(token)?.aiExtrasTarget).toBe('claude')
  })
})
