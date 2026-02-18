/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AI_SKILL_OPTIONS, type AgentsMdPreferences, type AiExtrasTarget } from '@/features/ai-extras/model/ai-extras'

import { AiExtrasPanel } from './ai-extras-panel'

const primarySkill = AI_SKILL_OPTIONS[0]

if (!primarySkill) {
  throw new Error('Expected at least one AI skill in the catalog.')
}

const defaultPreferences: AgentsMdPreferences = {
  includeFeatureBranchesGuidance: true,
  includeConventionalCommitsGuidance: true,
  includePullRequestsGuidance: true,
  includeRunRelevantTestsGuidance: true,
  includeTaskScopeDisciplineGuidance: true,
}

afterEach(() => {
  cleanup()
})

type RenderOptions = {
  selectedAiExtraIds?: string[]
  aiExtrasTarget?: AiExtrasTarget
  agentsMdPreferences?: AgentsMdPreferences
  onChangeAiExtrasTarget?: ReturnType<typeof vi.fn>
  onToggleAgentsMdEnabled?: ReturnType<typeof vi.fn>
  onToggleAgentsMdGuidance?: ReturnType<typeof vi.fn>
  onToggleAgentsMdPreference?: ReturnType<typeof vi.fn>
  onToggleAiSkill?: ReturnType<typeof vi.fn>
}

function renderAiExtrasPanel(options: RenderOptions = {}) {
  const onChangeAiExtrasTarget = options.onChangeAiExtrasTarget ?? vi.fn()
  const onToggleAgentsMdEnabled = options.onToggleAgentsMdEnabled ?? vi.fn()
  const onToggleAgentsMdGuidance = options.onToggleAgentsMdGuidance ?? vi.fn()
  const onToggleAgentsMdPreference = options.onToggleAgentsMdPreference ?? vi.fn()
  const onToggleAiSkill = options.onToggleAiSkill ?? vi.fn()

  render(
    <AiExtrasPanel
      selectedAiExtraIds={options.selectedAiExtraIds ?? []}
      aiExtrasTarget={options.aiExtrasTarget ?? 'agents'}
      agentsMdPreferences={options.agentsMdPreferences ?? defaultPreferences}
      onChangeAiExtrasTarget={onChangeAiExtrasTarget}
      onToggleAgentsMdEnabled={onToggleAgentsMdEnabled}
      onToggleAgentsMdGuidance={onToggleAgentsMdGuidance}
      onToggleAgentsMdPreference={onToggleAgentsMdPreference}
      onToggleAiSkill={onToggleAiSkill}
    />,
  )

  return {
    onChangeAiExtrasTarget,
    onToggleAgentsMdEnabled,
    onToggleAgentsMdGuidance,
    onToggleAgentsMdPreference,
    onToggleAiSkill,
  }
}

function expandPanel() {
  const disclosure = screen.getByTestId('ai-extras-disclosure')
  const summary = disclosure.querySelector('summary')

  if (!summary) {
    throw new Error('Expected AI extras disclosure summary to exist.')
  }

  fireEvent.click(summary)
}

function collapsePanel() {
  const disclosure = screen.getByTestId('ai-extras-disclosure')
  const summary = disclosure.querySelector('summary')

  if (!summary) {
    throw new Error('Expected AI extras disclosure summary to exist.')
  }

  fireEvent.click(summary)
}

describe('AiExtrasPanel', () => {
  it('starts collapsed without the old summary line', () => {
    renderAiExtrasPanel({
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      aiExtrasTarget: 'claude',
    })

    const disclosure = screen.getByTestId('ai-extras-disclosure') as HTMLDetailsElement
    const summary = disclosure.querySelector('summary')
    const summaryText = summary?.textContent ?? ''

    expect(disclosure.open).toBe(false)
    expect(summary?.getAttribute('aria-controls')).toBe('ai-extras-panel-content')
    expect(summary?.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Show options')).toBeTruthy()
    expect(summaryText.includes('File: CLAUDE.md')).toBe(false)
    expect(summaryText.includes('Guidance: On')).toBe(false)
    expect(summaryText.includes('Skills: 1 selected')).toBe(false)
  })

  it('expands and collapses through the toggle button', () => {
    renderAiExtrasPanel()
    const disclosure = screen.getByTestId('ai-extras-disclosure') as HTMLDetailsElement

    expandPanel()

    expect(disclosure.open).toBe(true)
    expect(disclosure.querySelector('summary')?.getAttribute('aria-expanded')).toBe('true')

    collapsePanel()

    expect(disclosure.open).toBe(false)
    expect(disclosure.querySelector('summary')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps selected values after collapsing and expanding again', () => {
    renderAiExtrasPanel({
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      aiExtrasTarget: 'agents',
    })

    expandPanel()

    let includeAgentsCheckbox = screen.getByLabelText('Include AGENTS.md') as HTMLInputElement
    let primarySkillCheckbox = screen.getByLabelText(primarySkill.label) as HTMLInputElement

    expect(includeAgentsCheckbox.checked).toBe(true)
    expect(primarySkillCheckbox.checked).toBe(true)

    collapsePanel()
    expandPanel()

    includeAgentsCheckbox = screen.getByLabelText('Include AGENTS.md') as HTMLInputElement
    primarySkillCheckbox = screen.getByLabelText(primarySkill.label) as HTMLInputElement

    expect(includeAgentsCheckbox.checked).toBe(true)
    expect(primarySkillCheckbox.checked).toBe(true)
  })

  it('keeps guidance and skills independent and triggers dedicated callbacks', () => {
    const onChangeAiExtrasTarget = vi.fn()
    const onToggleAgentsMdEnabled = vi.fn()
    const onToggleAgentsMdGuidance = vi.fn()
    const onToggleAgentsMdPreference = vi.fn()
    const onToggleAiSkill = vi.fn()

    renderAiExtrasPanel({
      selectedAiExtraIds: ['agents-md'],
      aiExtrasTarget: 'agents',
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: true,
        includeTaskScopeDisciplineGuidance: false,
      },
      onChangeAiExtrasTarget,
      onToggleAgentsMdEnabled,
      onToggleAgentsMdGuidance,
      onToggleAgentsMdPreference,
      onToggleAiSkill,
    })

    expandPanel()

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
    const onToggleAgentsMdEnabled = vi.fn()
    const onToggleAgentsMdPreference = vi.fn()
    const onToggleAgentsMdGuidance = vi.fn()

    renderAiExtrasPanel({
      selectedAiExtraIds: [],
      aiExtrasTarget: 'agents',
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: false,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: false,
        includeRunRelevantTestsGuidance: false,
        includeTaskScopeDisciplineGuidance: false,
      },
      onToggleAgentsMdEnabled,
      onToggleAgentsMdGuidance,
      onToggleAgentsMdPreference,
    })

    expandPanel()
    fireEvent.click(screen.getByLabelText('Feature branches'))

    expect(onToggleAgentsMdEnabled).toHaveBeenCalledTimes(1)
    expect(onToggleAgentsMdPreference).toHaveBeenCalledWith('includeFeatureBranchesGuidance')
    expect(onToggleAgentsMdGuidance).not.toHaveBeenCalled()
  })

  it('changes selected target through compact selector', () => {
    const onChangeAiExtrasTarget = vi.fn()

    renderAiExtrasPanel({
      selectedAiExtraIds: [],
      aiExtrasTarget: 'agents',
      onChangeAiExtrasTarget,
    })

    expandPanel()
    fireEvent.click(screen.getByLabelText('Generate CLAUDE.md'))

    expect(onChangeAiExtrasTarget).toHaveBeenCalledWith('claude')
  })

  it('shows claude paths when target is claude', () => {
    renderAiExtrasPanel({
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      aiExtrasTarget: 'claude',
    })

    expandPanel()

    expect(screen.getByLabelText('Include CLAUDE.md')).toBeTruthy()
    expect(screen.getByText('.claude/skills')).toBeTruthy()
  })

  it('shows combined paths when target is both', () => {
    renderAiExtrasPanel({
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      aiExtrasTarget: 'both',
    })

    expandPanel()

    expect(screen.getByLabelText('Include AGENTS.md + CLAUDE.md')).toBeTruthy()
    expect(screen.getByText('.agents/skills + .claude/skills')).toBeTruthy()
  })
})
