import {
  AI_SKILL_CATALOG_SOURCES,
  type AiSkillCatalogId,
} from './ai-skill-catalog'

export type AiSkillExtraId = AiSkillCatalogId
export type AiExtraId = 'agents-md' | AiSkillExtraId

export type AiExtrasTarget = 'agents' | 'claude' | 'both'

export type AiExtrasTargetOption = {
  id: AiExtrasTarget
  label: string
}

export type AiExtraPanelOptionId = 'agents-md-guidance' | 'skills'

export type AiExtraPanelOption = {
  id: AiExtraPanelOptionId
  label: string
  description: string
}

export type AiSkillOption = {
  id: AiSkillExtraId
  label: string
  description: string
  directoryName: string
  sortOrder: number
}

export type AgentsMdPreferences = {
  includeFeatureBranchesGuidance: boolean
  includeConventionalCommitsGuidance: boolean
  includePullRequestsGuidance: boolean
  includeRunRelevantTestsGuidance: boolean
  includeTaskScopeDisciplineGuidance: boolean
}

export type AgentsMdPreferenceOption = {
  id: keyof AgentsMdPreferences
  guidanceId: AgentsMdGuidanceId
  label: string
  description: string
}

export type AgentsMdGuidanceId = 'git-workflow' | 'delivery-workflow'

export type AgentsMdGuidanceOption = {
  id: AgentsMdGuidanceId
  label: string
  description: string
}

export const DEFAULT_AI_EXTRAS_TARGET: AiExtrasTarget = 'agents'
export const AI_EXTRAS_TARGET_OPTIONS: readonly AiExtrasTargetOption[] = [
  {
    id: 'agents',
    label: 'AGENTS.md',
  },
  {
    id: 'claude',
    label: 'CLAUDE.md',
  },
  {
    id: 'both',
    label: 'Both',
  },
] as const

export const AI_EXTRA_PANEL_OPTIONS: readonly AiExtraPanelOption[] = [
  {
    id: 'agents-md-guidance',
    label: 'Include AGENTS.md',
    description: 'Generate an AGENTS.md with configurable guidance modules.',
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Generate a curated Core Java skills catalog in the selected skills directory.',
  },
] as const

export const AI_SKILL_OPTIONS: readonly AiSkillOption[] = AI_SKILL_CATALOG_SOURCES.map(
  (skillSource) => ({
    id: skillSource.id,
    label: skillSource.label,
    description: skillSource.description,
    directoryName: skillSource.directoryName,
    sortOrder: skillSource.sortOrder,
  }),
)

const AI_EXTRAS_TARGET_SET = new Set<AiExtrasTarget>(['agents', 'claude', 'both'])
const AI_EXTRA_ID_SET = new Set<string>([
  'agents-md',
  ...AI_SKILL_OPTIONS.map((option) => option.id),
])
const AI_SKILL_ID_SET = new Set<string>(AI_SKILL_OPTIONS.map((option) => option.id))
const AI_SKILL_OPTION_BY_ID = new Map<AiSkillExtraId, AiSkillOption>(
  AI_SKILL_OPTIONS.map((option) => [option.id, option]),
)

export const DEFAULT_AGENTS_MD_PREFERENCES: AgentsMdPreferences = {
  includeFeatureBranchesGuidance: true,
  includeConventionalCommitsGuidance: true,
  includePullRequestsGuidance: true,
  includeRunRelevantTestsGuidance: true,
  includeTaskScopeDisciplineGuidance: true,
}

export const AGENTS_MD_GUIDANCE_OPTIONS: readonly AgentsMdGuidanceOption[] = [
  {
    id: 'git-workflow',
    label: 'Git workflow guidance',
    description: 'Adds Git workflow rules to AGENTS.md.',
  },
  {
    id: 'delivery-workflow',
    label: 'Delivery workflow guidance',
    description: 'Adds delivery execution rules to AGENTS.md.',
  },
] as const

export const AGENTS_MD_PREFERENCE_OPTIONS: readonly AgentsMdPreferenceOption[] = [
  {
    id: 'includeFeatureBranchesGuidance',
    guidanceId: 'git-workflow',
    label: 'Feature branches',
    description: 'Recommend isolated work on feature branches.',
  },
  {
    id: 'includeConventionalCommitsGuidance',
    guidanceId: 'git-workflow',
    label: 'Conventional commits',
    description: 'Recommend structured Conventional Commit messages.',
  },
  {
    id: 'includePullRequestsGuidance',
    guidanceId: 'git-workflow',
    label: 'Mandatory pull requests',
    description: 'Recommend mandatory pull requests and human review.',
  },
  {
    id: 'includeRunRelevantTestsGuidance',
    guidanceId: 'delivery-workflow',
    label: 'Run relevant tests',
    description: 'Recommend running relevant tests before finishing.',
  },
  {
    id: 'includeTaskScopeDisciplineGuidance',
    guidanceId: 'delivery-workflow',
    label: 'Stay within task scope',
    description: 'Recommend avoiding broad changes outside requested scope.',
  },
] as const

export const AGENTS_MD_PREFERENCE_MARKDOWN_LINES: Readonly<
  Record<keyof AgentsMdPreferences, string>
> = {
  includeFeatureBranchesGuidance: '- Use feature branches for all non-trivial changes.',
  includeConventionalCommitsGuidance:
    '- Use Conventional Commit messages for every commit.',
  includePullRequestsGuidance:
    '- Require pull requests with human review before merging.',
  includeRunRelevantTestsGuidance:
    '- Run relevant tests before considering the task complete.',
  includeTaskScopeDisciplineGuidance:
    '- Keep changes within the requested scope and avoid unrelated rewrites.',
}

export function getAllAiExtraIds(): AiExtraId[] {
  return normalizeSelectedAiExtraIds(['agents-md', ...AI_SKILL_OPTIONS.map((option) => option.id)])
}

export function isAllAgentsMdGuidanceEnabled(preferences: AgentsMdPreferences): boolean {
  return AGENTS_MD_PREFERENCE_OPTIONS.every((option) => preferences[option.id])
}

export function areAllAiPowerUpOptionsEnabled(
  selectedAiExtraIds: string[],
  preferences: AgentsMdPreferences,
): boolean {
  const selectedIdSet = new Set(normalizeSelectedAiExtraIds(selectedAiExtraIds))
  const allExtraIdsSelected = getAllAiExtraIds().every((extraId) => selectedIdSet.has(extraId))

  return allExtraIdsSelected && isAllAgentsMdGuidanceEnabled(preferences)
}

export function setAllAgentsMdPreferences(enabled: boolean): AgentsMdPreferences {
  const nextPreferences: Partial<AgentsMdPreferences> = {}

  for (const option of AGENTS_MD_PREFERENCE_OPTIONS) {
    nextPreferences[option.id] = enabled
  }

  return normalizeAgentsMdPreferences(nextPreferences)
}

export function normalizeSelectedAiExtraIds(ids: string[]): AiExtraId[] {
  return Array.from(
    new Set(ids.map((id) => id.trim()).filter((id): id is AiExtraId => AI_EXTRA_ID_SET.has(id as AiExtraId))),
  ).sort((left, right) => left.localeCompare(right))
}

export function normalizeSelectedAiSkillExtraIds(ids: string[]): AiSkillExtraId[] {
  return Array.from(
    new Set(ids.map((id) => id.trim()).filter((id): id is AiSkillExtraId => AI_SKILL_ID_SET.has(id as AiSkillExtraId))),
  ).sort((left, right) => left.localeCompare(right))
}

export function normalizeAiExtrasTarget(value: unknown): AiExtrasTarget {
  if (typeof value !== 'string') {
    return DEFAULT_AI_EXTRAS_TARGET
  }

  const normalizedValue = value.trim().toLowerCase()

  return AI_EXTRAS_TARGET_SET.has(normalizedValue as AiExtrasTarget)
    ? (normalizedValue as AiExtrasTarget)
    : DEFAULT_AI_EXTRAS_TARGET
}

export function resolveAgentsMdFilePaths(target: AiExtrasTarget): string[] {
  if (target === 'claude') {
    return ['CLAUDE.md']
  }

  if (target === 'both') {
    return ['AGENTS.md', 'CLAUDE.md']
  }

  return ['AGENTS.md']
}

export function resolveAiSkillsRootPaths(target: AiExtrasTarget): string[] {
  if (target === 'claude') {
    return ['.claude/skills']
  }

  if (target === 'both') {
    return ['.agents/skills', '.claude/skills']
  }

  return ['.agents/skills']
}

export function getAiSkillOption(skillId: AiSkillExtraId): AiSkillOption | undefined {
  return AI_SKILL_OPTION_BY_ID.get(skillId)
}

export function resolveAiSkillPathHints(
  skillId: AiSkillExtraId,
  target: AiExtrasTarget,
): string[] {
  const skillOption = getAiSkillOption(skillId)

  if (!skillOption) {
    return []
  }

  return resolveAiSkillsRootPaths(target).map(
    (rootPath) => `${rootPath}/${skillOption.directoryName}/SKILL.md`,
  )
}

export function getSelectedAiSkillExtraIds(ids: string[]): AiSkillExtraId[] {
  return normalizeSelectedAiSkillExtraIds(ids)
}

export function isAiSkillExtraId(id: string): id is AiSkillExtraId {
  return AI_SKILL_ID_SET.has(id as AiSkillExtraId)
}

export function getAgentsMdPreferenceIdsByGuidance(
  guidanceId: AgentsMdGuidanceId,
): Array<keyof AgentsMdPreferences> {
  return AGENTS_MD_PREFERENCE_OPTIONS
    .filter((option) => option.guidanceId === guidanceId)
    .map((option) => option.id)
}

export function isAgentsMdGuidanceEnabled(
  preferences: AgentsMdPreferences,
  guidanceId: AgentsMdGuidanceId,
): boolean {
  const preferenceIds = getAgentsMdPreferenceIdsByGuidance(guidanceId)

  return preferenceIds.some((preferenceId) => preferences[preferenceId])
}

export function getAgentsMdGuidanceMarkdownLines(
  preferences: AgentsMdPreferences,
  guidanceId: AgentsMdGuidanceId,
): string[] {
  return AGENTS_MD_PREFERENCE_OPTIONS
    .filter((option) => option.guidanceId === guidanceId && preferences[option.id])
    .map((option) => AGENTS_MD_PREFERENCE_MARKDOWN_LINES[option.id])
}

export function buildAgentsMdMarkdown(
  preferences: AgentsMdPreferences,
  options?: {
    documentTitle?: string
  },
): string {
  const gitGuidanceLines = getAgentsMdGuidanceMarkdownLines(preferences, 'git-workflow')
  const deliveryGuidanceLines = getAgentsMdGuidanceMarkdownLines(
    preferences,
    'delivery-workflow',
  )
  const documentTitle = options?.documentTitle?.trim() || 'AGENTS.md'

  const lines = [
    `# ${documentTitle}`,
    '',
    '## Scope',
    'Keep changes focused on explicit task requirements and avoid speculative rewrites.',
    '',
    '## Workflow',
    '- Understand the task before editing code.',
    '- Prefer small, reviewable changes with clear intent.',
    '- Preserve existing architecture and conventions unless a refactor is explicitly requested.',
    '',
    '## Code Quality',
    '- Keep code readable, typed, and production-ready.',
    '- Add concise comments only when intent is not obvious from code.',
  ]

  if (gitGuidanceLines.length > 0) {
    lines.push('', '## Git Guidelines', ...gitGuidanceLines)
  }

  if (deliveryGuidanceLines.length > 0) {
    lines.push('', '## Delivery Guidelines', ...deliveryGuidanceLines)
  }

  return lines.join('\n')
}

export function normalizeAgentsMdPreferences(
  value: Partial<AgentsMdPreferences> | null | undefined,
): AgentsMdPreferences {
  return {
    includeFeatureBranchesGuidance:
      typeof value?.includeFeatureBranchesGuidance === 'boolean'
        ? value.includeFeatureBranchesGuidance
        : DEFAULT_AGENTS_MD_PREFERENCES.includeFeatureBranchesGuidance,
    includeConventionalCommitsGuidance:
      typeof value?.includeConventionalCommitsGuidance === 'boolean'
        ? value.includeConventionalCommitsGuidance
        : DEFAULT_AGENTS_MD_PREFERENCES.includeConventionalCommitsGuidance,
    includePullRequestsGuidance:
      typeof value?.includePullRequestsGuidance === 'boolean'
        ? value.includePullRequestsGuidance
        : DEFAULT_AGENTS_MD_PREFERENCES.includePullRequestsGuidance,
    includeRunRelevantTestsGuidance:
      typeof value?.includeRunRelevantTestsGuidance === 'boolean'
        ? value.includeRunRelevantTestsGuidance
        : DEFAULT_AGENTS_MD_PREFERENCES.includeRunRelevantTestsGuidance,
    includeTaskScopeDisciplineGuidance:
      typeof value?.includeTaskScopeDisciplineGuidance === 'boolean'
        ? value.includeTaskScopeDisciplineGuidance
        : DEFAULT_AGENTS_MD_PREFERENCES.includeTaskScopeDisciplineGuidance,
  }
}
