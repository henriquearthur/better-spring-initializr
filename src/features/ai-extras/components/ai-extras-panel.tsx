import { BookMarked, Check, ChevronDown, GitBranch, Sparkles, Wrench } from 'lucide-react'
import type { MouseEvent } from 'react'

import {
  AGENTS_MD_GUIDANCE_OPTIONS,
  AGENTS_MD_PREFERENCE_OPTIONS,
  type AgentsMdGuidanceId,
  type AgentsMdPreferences,
  AI_EXTRAS_TARGET_OPTIONS,
  AI_SKILL_OPTIONS,
  type AiExtrasTarget,
  type AiSkillExtraId,
  areAllAiPowerUpOptionsEnabled,
  getSelectedAiSkillExtraIds,
  isAgentsMdGuidanceEnabled,
  resolveAgentsMdFilePaths,
  resolveAiSkillsRootPaths,
} from '@/features/ai-extras/model/ai-extras'

const GUIDANCE_SECTION_LABELS: Record<AgentsMdGuidanceId, string> = {
  'git-workflow': 'GIT GUIDELINES',
  'delivery-workflow': 'DELIVERY GUIDELINES',
}

const AI_EXTRAS_CONTENT_ID = 'ai-extras-panel-content'

type AiExtrasPanelProps = {
  selectedAiExtraIds: string[]
  aiExtrasTarget: AiExtrasTarget
  agentsMdPreferences: AgentsMdPreferences
  onChangeAiExtrasTarget: (target: AiExtrasTarget) => void
  onToggleAllAiPowerUp: () => void
  onToggleAgentsMdEnabled: () => void
  onToggleAgentsMdGuidance: (guidanceId: AgentsMdGuidanceId) => void
  onToggleAgentsMdPreference: (preferenceId: keyof AgentsMdPreferences) => void
  onToggleAiSkill: (skillId: AiSkillExtraId) => void
}

export function AiExtrasPanel({
  selectedAiExtraIds,
  aiExtrasTarget,
  agentsMdPreferences,
  onChangeAiExtrasTarget,
  onToggleAllAiPowerUp,
  onToggleAgentsMdEnabled,
  onToggleAgentsMdGuidance,
  onToggleAgentsMdPreference,
  onToggleAiSkill,
}: AiExtrasPanelProps) {
  const selectedIdSet = new Set(selectedAiExtraIds)
  const selectedSkillIds = getSelectedAiSkillExtraIds(selectedAiExtraIds)
  const agentsMdEnabled = selectedIdSet.has('agents-md')
  const guidanceFilePaths = resolveAgentsMdFilePaths(aiExtrasTarget)
  const guidanceFileLabel = guidanceFilePaths.join(' + ')
  const skillsRootPaths = resolveAiSkillsRootPaths(aiExtrasTarget)
  const allAiPowerUpSelected = areAllAiPowerUpOptionsEnabled(
    selectedAiExtraIds,
    agentsMdPreferences,
  )

  const handleToggleChildPreference = (preferenceId: keyof AgentsMdPreferences) => {
    if (!agentsMdEnabled) {
      onToggleAgentsMdEnabled()

      if (!agentsMdPreferences[preferenceId]) {
        onToggleAgentsMdPreference(preferenceId)
      }

      return
    }

    onToggleAgentsMdPreference(preferenceId)
  }

  const handleDisclosureSummaryClick = (event: MouseEvent<HTMLElement>) => {
    const detailsElement = event.currentTarget.parentElement

    if (!(detailsElement instanceof HTMLDetailsElement)) {
      return
    }

    event.currentTarget.setAttribute('aria-expanded', detailsElement.open ? 'false' : 'true')
  }

  return (
    <section className="ai-extras-panel" data-testid="ai-extras-panel">
      <details className="ai-extras-disclosure" data-testid="ai-extras-disclosure">
        <summary
          className="ai-extras-disclosure-summary"
          aria-controls={AI_EXTRAS_CONTENT_ID}
          aria-expanded="false"
          onClick={handleDisclosureSummaryClick}
        >
          <div className="ai-extras-panel-header">
            <div className="space-y-1">
              <p className="ai-extras-panel-badge">
                <Sparkles className="h-3.5 w-3.5" />
                AI Power-Up
              </p>
              <p className="text-sm font-semibold">Using AI coding agents?</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Add CLAUDE.md or AGENTS.md and Agent Skills focused on Java and Spring ecosystem for AI-assisted development.
              </p>
            </div>

            <span className="ai-extras-expand-toggle" aria-hidden="true">
              <span className="ai-extras-expand-label ai-extras-expand-label-closed">Show options</span>
              <span className="ai-extras-expand-label ai-extras-expand-label-open">Hide options</span>
              <ChevronDown className="ai-extras-expand-icon h-4 w-4 transition-transform" />
            </span>
          </div>

        </summary>

        <div id={AI_EXTRAS_CONTENT_ID} className="ai-extras-content">
          <div className="ai-extras-target-compact" role="radiogroup" aria-label="Guidance file target">
            <span className="ai-extras-target-compact-label">File</span>
            {AI_EXTRAS_TARGET_OPTIONS.map((targetOption) => {
              const selected = targetOption.id === aiExtrasTarget

              return (
                <button
                  key={targetOption.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Generate ${targetOption.label}`}
                  className={`ai-extras-target-chip ${selected ? 'ai-extras-target-chip-selected' : ''}`}
                  onClick={() => onChangeAiExtrasTarget(targetOption.id)}
                >
                  {targetOption.label}
                </button>
              )
            })}
          </div>

          <div className={`ai-extra-parent-option mt-2 ${allAiPowerUpSelected ? 'ai-extra-option-selected' : ''}`}>
            <AiExtrasCheckbox
              id="ai-power-up-toggle-all"
              checked={allAiPowerUpSelected}
              onChange={onToggleAllAiPowerUp}
              label="Include all guidance and skills"
              description="One-click toggle for guidance files, all guidance modules, and all available skills."
            />
          </div>

          <div className="ai-extras-detail-grid">
            <div
              className={`ai-extras-customization ai-extras-area ${agentsMdEnabled ? '' : 'ai-extras-customization-disabled'}`}
            >
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <GitBranch className="h-4 w-4" />
                Guidance Files
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                File: <span className="font-mono">{guidanceFileLabel}</span>
              </p>

              <div className={`ai-extra-parent-option mt-2 ${agentsMdEnabled ? 'ai-extra-option-selected' : ''}`}>
                <AiExtrasCheckbox
                  id="agents-md-toggle"
                  checked={agentsMdEnabled}
                  onChange={onToggleAgentsMdEnabled}
                  label={`Include ${guidanceFileLabel}`}
                  description={`Generates ${guidanceFileLabel} with your selected guidelines.`}
                />
              </div>

              <div className="mt-2 grid gap-2.5">
                {AGENTS_MD_GUIDANCE_OPTIONS.map((guidance) => {
                  const guidanceEnabled = isAgentsMdGuidanceEnabled(agentsMdPreferences, guidance.id)
                  const guidancePreferences = AGENTS_MD_PREFERENCE_OPTIONS.filter(
                    (option) => option.guidanceId === guidance.id,
                  )
                  const guidanceToggleId = `guidance-toggle-${guidance.id}`

                  return (
                    <div key={guidance.id} className="ai-extra-guidance-group">
                      <p className="ai-extra-guidance-heading">
                        <BookMarked className="h-3.5 w-3.5" />
                        {GUIDANCE_SECTION_LABELS[guidance.id]}
                      </p>

                      <div
                        className={`ai-extra-parent-option mt-1 ${guidanceEnabled ? 'ai-extra-option-selected' : ''} ${agentsMdEnabled ? '' : 'ai-extra-option-disabled'}`}
                      >
                        <AiExtrasCheckbox
                          id={guidanceToggleId}
                          checked={guidanceEnabled}
                          onChange={() => onToggleAgentsMdGuidance(guidance.id)}
                          disabled={!agentsMdEnabled}
                          label={guidance.label}
                          description={guidance.description}
                        />
                      </div>

                      <div className="mt-1.5 grid gap-1.5">
                        {guidancePreferences.map((option) => {
                          const preferenceChecked = agentsMdEnabled && agentsMdPreferences[option.id]

                          return (
                            <div
                              key={option.id}
                              className={`ai-extra-preference-option ai-extra-child-option ${preferenceChecked ? 'ai-extra-option-selected' : ''}`}
                            >
                              <AiExtrasCheckbox
                                id={`guidance-preference-${option.id}`}
                                checked={preferenceChecked}
                                onChange={() => handleToggleChildPreference(option.id)}
                                label={option.label}
                                compact
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`ai-extras-customization ai-extras-area ${selectedSkillIds.length > 0 ? 'ai-extra-option-selected' : ''}`}>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Wrench className="h-4 w-4" />
                Skills
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Directory: <span className="font-mono">{skillsRootPaths.join(' + ')}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">
                {selectedSkillIds.length} selected
              </p>

              <div className="mt-2 grid gap-2">
                {AI_SKILL_OPTIONS.map((skill) => {
                  const selected = selectedIdSet.has(skill.id)
                  const skillInputId = `ai-skill-${skill.id}`

                  return (
                    <div
                      key={skill.id}
                      className={`ai-extra-parent-option ${selected ? 'ai-extra-option-selected' : ''}`}
                    >
                      <AiExtrasCheckbox
                        id={skillInputId}
                        checked={selected}
                        onChange={() => onToggleAiSkill(skill.id)}
                        label={skill.label}
                        description={skill.description}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}

type AiExtrasCheckboxProps = {
  id: string
  checked: boolean
  label: string
  onChange: () => void
  description?: string
  disabled?: boolean
  compact?: boolean
}

function AiExtrasCheckbox({
  id,
  checked,
  label,
  onChange,
  description,
  disabled = false,
  compact = false,
}: AiExtrasCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`ai-extra-checkbox-row ${compact ? 'ai-extra-checkbox-row-compact' : ''} ${disabled ? 'ai-extra-checkbox-row-disabled' : ''}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ai-extra-checkbox-input"
        aria-label={label}
      />
      <span className="ai-extra-checkbox-indicator" aria-hidden="true">
        <Check className="ai-extra-checkbox-check h-3 w-3" />
      </span>
      <span className="min-w-0 space-y-0.5">
        <p className={`font-semibold ${compact ? 'text-[11px] leading-none' : 'text-xs'}`}>{label}</p>
        {description ? (
          <p className="text-[11px] text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </span>
    </label>
  )
}
