/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AI_SKILL_OPTIONS } from '@/lib/ai-extras'

import { AiExtrasPanel } from './ai-extras-panel'

const primarySkill = AI_SKILL_OPTIONS[0]

if (!primarySkill) {
  throw new Error('Expected at least one AI skill in the catalog.')
}

afterEach(() => {
  cleanup()
})

describe('AiExtrasPanel', () => {
  it('keeps guidance and skills independent and triggers dedicated callbacks', () => {
    const onChangeAiExtrasTarget = vi.fn()
    const onToggleAgentsMdEnabled = vi.fn()
    const onToggleAgentsMdGuidance = vi.fn()
    const onToggleAgentsMdPreference = vi.fn()
    const onToggleAiSkill = vi.fn()

    render(
      <AiExtrasPanel
        selectedAiExtraIds={['agents-md']}
        aiExtrasTarget="agents"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: true,
          includeConventionalCommitsGuidance: false,
          includePullRequestsGuidance: true,
          includeRunRelevantTestsGuidance: true,
          includeTaskScopeDisciplineGuidance: false,
        }}
        onChangeAiExtrasTarget={onChangeAiExtrasTarget}
        onToggleAgentsMdEnabled={onToggleAgentsMdEnabled}
        onToggleAgentsMdGuidance={onToggleAgentsMdGuidance}
        onToggleAgentsMdPreference={onToggleAgentsMdPreference}
        onToggleAiSkill={onToggleAiSkill}
      />,
    )

    expect(screen.getByText('GIT GUIDELINES')).toBeTruthy()
    expect(screen.getByText('DELIVERY GUIDELINES')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Include AGENTS.md'))
    fireEvent.click(screen.getByLabelText('Git workflow guidance'))
    fireEvent.click(screen.getByLabelText('Delivery workflow guidance'))
    fireEvent.click(screen.getByLabelText('Conventional commits'))
    fireEvent.click(screen.getByLabelText(primarySkill.label))

    expect(onToggleAgentsMdEnabled).toHaveBeenCalledTimes(1)
    expect(onToggleAgentsMdGuidance.mock.calls).toEqual([
      ['git-workflow'],
      ['delivery-workflow'],
    ])
    expect(onToggleAgentsMdPreference.mock.calls).toEqual([
      ['includeConventionalCommitsGuidance'],
    ])
    expect(onToggleAiSkill.mock.calls).toEqual([[primarySkill.id]])
    expect(onChangeAiExtrasTarget).not.toHaveBeenCalled()
  })

  it('enables AGENTS.md when a child guideline is toggled while parent is disabled', () => {
    const onChangeAiExtrasTarget = vi.fn()
    const onToggleAgentsMdEnabled = vi.fn()
    const onToggleAgentsMdGuidance = vi.fn()
    const onToggleAgentsMdPreference = vi.fn()
    const onToggleAiSkill = vi.fn()

    render(
      <AiExtrasPanel
        selectedAiExtraIds={[]}
        aiExtrasTarget="agents"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: false,
          includeConventionalCommitsGuidance: false,
          includePullRequestsGuidance: false,
          includeRunRelevantTestsGuidance: false,
          includeTaskScopeDisciplineGuidance: false,
        }}
        onChangeAiExtrasTarget={onChangeAiExtrasTarget}
        onToggleAgentsMdEnabled={onToggleAgentsMdEnabled}
        onToggleAgentsMdGuidance={onToggleAgentsMdGuidance}
        onToggleAgentsMdPreference={onToggleAgentsMdPreference}
        onToggleAiSkill={onToggleAiSkill}
      />,
    )

    const featureBranchOptions = screen.getAllByLabelText('Feature branches')
    fireEvent.click(featureBranchOptions[featureBranchOptions.length - 1]!)

    expect(onToggleAgentsMdEnabled).toHaveBeenCalledTimes(1)
    expect(onToggleAgentsMdPreference).toHaveBeenCalledWith('includeFeatureBranchesGuidance')
    expect(onToggleAgentsMdGuidance).not.toHaveBeenCalled()
  })

  it('changes selected target through compact selector', () => {
    const onChangeAiExtrasTarget = vi.fn()

    render(
      <AiExtrasPanel
        selectedAiExtraIds={[]}
        aiExtrasTarget="agents"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: true,
          includeConventionalCommitsGuidance: true,
          includePullRequestsGuidance: true,
          includeRunRelevantTestsGuidance: true,
          includeTaskScopeDisciplineGuidance: true,
        }}
        onChangeAiExtrasTarget={onChangeAiExtrasTarget}
        onToggleAgentsMdEnabled={() => undefined}
        onToggleAgentsMdGuidance={() => undefined}
        onToggleAgentsMdPreference={() => undefined}
        onToggleAiSkill={() => undefined}
      />,
    )

    fireEvent.click(screen.getByLabelText('Generate CLAUDE.md'))

    expect(onChangeAiExtrasTarget).toHaveBeenCalledWith('claude')
  })

  it('uses CLAUDE paths when target is claude', () => {
    render(
      <AiExtrasPanel
        selectedAiExtraIds={['agents-md', primarySkill.id]}
        aiExtrasTarget="claude"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: true,
          includeConventionalCommitsGuidance: true,
          includePullRequestsGuidance: true,
          includeRunRelevantTestsGuidance: true,
          includeTaskScopeDisciplineGuidance: true,
        }}
        onChangeAiExtrasTarget={() => undefined}
        onToggleAgentsMdEnabled={() => undefined}
        onToggleAgentsMdGuidance={() => undefined}
        onToggleAgentsMdPreference={() => undefined}
        onToggleAiSkill={() => undefined}
      />,
    )

    expect(screen.getByLabelText('Include CLAUDE.md')).toBeTruthy()
    expect(screen.getByText('.claude/skills')).toBeTruthy()
  })

  it('uses .agents paths for agents target', () => {
    render(
      <AiExtrasPanel
        selectedAiExtraIds={['agents-md', primarySkill.id]}
        aiExtrasTarget="agents"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: true,
          includeConventionalCommitsGuidance: true,
          includePullRequestsGuidance: true,
          includeRunRelevantTestsGuidance: true,
          includeTaskScopeDisciplineGuidance: true,
        }}
        onChangeAiExtrasTarget={() => undefined}
        onToggleAgentsMdEnabled={() => undefined}
        onToggleAgentsMdGuidance={() => undefined}
        onToggleAgentsMdPreference={() => undefined}
        onToggleAiSkill={() => undefined}
      />,
    )

    expect(screen.getByLabelText('Include AGENTS.md')).toBeTruthy()
    expect(screen.getByText('.agents/skills')).toBeTruthy()
  })

  it('shows combined paths when target is both', () => {
    render(
      <AiExtrasPanel
        selectedAiExtraIds={['agents-md', primarySkill.id]}
        aiExtrasTarget="both"
        agentsMdPreferences={{
          includeFeatureBranchesGuidance: true,
          includeConventionalCommitsGuidance: true,
          includePullRequestsGuidance: true,
          includeRunRelevantTestsGuidance: true,
          includeTaskScopeDisciplineGuidance: true,
        }}
        onChangeAiExtrasTarget={() => undefined}
        onToggleAgentsMdEnabled={() => undefined}
        onToggleAgentsMdGuidance={() => undefined}
        onToggleAgentsMdPreference={() => undefined}
        onToggleAiSkill={() => undefined}
      />,
    )

    expect(screen.getByLabelText('Include AGENTS.md + CLAUDE.md')).toBeTruthy()
    expect(screen.getByText('.agents/skills + .claude/skills')).toBeTruthy()
  })
})
