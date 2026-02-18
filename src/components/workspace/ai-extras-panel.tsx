import { BookMarked, GitBranch, Sparkles, Wrench } from 'lucide-react'

import {
  AGENTS_MD_GUIDANCE_OPTIONS,
  AGENTS_MD_PREFERENCE_OPTIONS,
  AI_EXTRAS_TARGET_OPTIONS,
  AI_SKILL_OPTIONS,
  resolveAiSkillsRootPaths,
  resolveAgentsMdFilePaths,
  getSelectedAiSkillExtraIds,
  isAgentsMdGuidanceEnabled,
  type AiExtrasTarget,
  type AgentsMdGuidanceId,
  type AgentsMdPreferences,
  type AiSkillExtraId,
} from '@/lib/ai-extras'

const GUIDANCE_SECTION_LABELS: Record<AgentsMdGuidanceId, string> = {
  'git-workflow': 'GIT GUIDELINES',
  'delivery-workflow': 'DELIVERY GUIDELINES',
}

type AiExtrasPanelProps = {
  selectedAiExtraIds: string[]
  aiExtrasTarget: AiExtrasTarget
  agentsMdPreferences: AgentsMdPreferences
  onChangeAiExtrasTarget: (target: AiExtrasTarget) => void
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

  return (
    <section className="ai-extras-panel" data-testid="ai-extras-panel">
      <div className="ai-extras-panel-header">
        <div className="space-y-1">
          <p className="ai-extras-panel-badge">
            <Sparkles className="h-3.5 w-3.5" />
            Optional
          </p>
          <p className="text-sm font-semibold">AI Extras</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Configure guidance and skills for generated projects.
          </p>
        </div>
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
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <input
                  id="agents-md-toggle"
                  type="checkbox"
                  checked={agentsMdEnabled}
                  onChange={onToggleAgentsMdEnabled}
                  className="mt-0.5 h-4 w-4 rounded border"
                  aria-label={`Include ${guidanceFileLabel}`}
                />
                <label htmlFor="agents-md-toggle" className="space-y-0.5">
                  <p className="text-xs font-semibold">Include {guidanceFileLabel}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Generates {guidanceFileLabel} with your selected guidelines.
                  </p>
                </label>
              </div>
            </div>
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
                    className={`ai-extra-parent-option mt-1 ${guidanceEnabled ? 'ai-extra-option-selected' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <input
                          id={guidanceToggleId}
                          type="checkbox"
                          checked={guidanceEnabled}
                          onChange={() => onToggleAgentsMdGuidance(guidance.id)}
                          disabled={!agentsMdEnabled}
                          className="mt-0.5 h-4 w-4 rounded border"
                          aria-label={guidance.label}
                        />
                        <label htmlFor={guidanceToggleId} className="space-y-0.5">
                          <p className="text-xs font-semibold">{guidance.label}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            {guidance.description}
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 grid gap-1.5">
                    {guidancePreferences.map((option) => (
                      <label key={option.id} className="ai-extra-preference-option ai-extra-child-option">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={agentsMdEnabled && agentsMdPreferences[option.id]}
                            onChange={() => handleToggleChildPreference(option.id)}
                            className="h-3.5 w-3.5 rounded border"
                            aria-label={option.label}
                          />
                          <p className="text-[11px] font-medium leading-none">{option.label}</p>
                        </div>
                      </label>
                    ))}
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
                <label
                  key={skill.id}
                  htmlFor={skillInputId}
                  className={`ai-extra-parent-option ${selected ? 'ai-extra-option-selected' : ''}`}
                >
                  <div className="ai-extra-skill-row">
                    <input
                      id={skillInputId}
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleAiSkill(skill.id)}
                      className="mt-0.5 h-4 w-4 rounded border"
                      aria-label={skill.label}
                    />
                    <div className="ai-extra-skill-content">
                      <p className="ai-extra-skill-title">{skill.label}</p>
                      <p className="ai-extra-skill-description">{skill.description}</p>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
