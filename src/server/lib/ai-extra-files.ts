import {
  buildAgentsMdMarkdown,
  getAiSkillOption,
  isAiSkillExtraId,
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  resolveAgentsMdFilePaths,
  resolveAiSkillsRootPaths,
  type AgentsMdPreferences,
  type AiExtrasTarget,
  type AiSkillExtraId,
} from '@/lib/ai-extras'
import type { ProjectConfig } from '@/lib/project-config'

import javaCodeReviewSkillMarkdown from './ai-extra-sources/claude-code-java/java-code-review/SKILL.md?raw'
import jpaPatternsSkillMarkdown from './ai-extra-sources/claude-code-java/jpa-patterns/SKILL.md?raw'
import securityAuditSkillMarkdown from './ai-extra-sources/claude-code-java/security-audit/SKILL.md?raw'
import springBootPatternsSkillMarkdown from './ai-extra-sources/claude-code-java/spring-boot-patterns/SKILL.md?raw'
import testQualitySkillMarkdown from './ai-extra-sources/claude-code-java/test-quality/SKILL.md?raw'

export type AiExtraGeneratedFile = {
  path: string
  content: string
}

type ResolveAiExtraFilesInput = {
  config: ProjectConfig
  selectedAiExtraIds: string[]
  agentsMdPreferences: Partial<AgentsMdPreferences> | undefined
  aiExtrasTarget: AiExtrasTarget | undefined
}

const AI_SKILL_MARKDOWN_BY_ID: Readonly<Record<AiSkillExtraId, string>> = {
  'skill-java-code-review': javaCodeReviewSkillMarkdown,
  'skill-spring-boot-patterns': springBootPatternsSkillMarkdown,
  'skill-jpa-patterns': jpaPatternsSkillMarkdown,
  'skill-test-quality': testQualitySkillMarkdown,
  'skill-security-audit': securityAuditSkillMarkdown,
}

export function resolveAiExtraFiles(input: ResolveAiExtraFilesInput): AiExtraGeneratedFile[] {
  const selectedIds = normalizeSelectedAiExtraIds(input.selectedAiExtraIds)
  const selectedIdSet = new Set(selectedIds)
  const agentsMdPreferences = normalizeAgentsMdPreferences(input.agentsMdPreferences)
  const aiExtrasTarget = normalizeAiExtrasTarget(input.aiExtrasTarget)
  const fileMap = new Map<string, string>()

  if (selectedIdSet.has('agents-md')) {
    for (const agentsPath of resolveAgentsMdFilePaths(aiExtrasTarget)) {
      fileMap.set(
        agentsPath,
        buildAgentsMdMarkdown(agentsMdPreferences, {
          documentTitle: agentsPath,
        }),
      )
    }
  }

  for (const selectedId of selectedIds) {
    if (!isAiSkillExtraId(selectedId)) {
      continue
    }

    const skillOption = getAiSkillOption(selectedId)

    if (!skillOption) {
      continue
    }

    const skillMarkdown = AI_SKILL_MARKDOWN_BY_ID[selectedId]

    for (const skillsRootPath of resolveAiSkillsRootPaths(aiExtrasTarget)) {
      fileMap.set(`${skillsRootPath}/${skillOption.directoryName}/SKILL.md`, skillMarkdown)
    }
  }

  return Array.from(fileMap.entries())
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path))
}
