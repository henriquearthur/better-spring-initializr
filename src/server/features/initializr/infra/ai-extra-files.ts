import {
  type AgentsMdPreferences,
  AI_SKILL_OPTIONS,
  type AiExtrasTarget,
  type AiSkillExtraId,
  type AiSkillOption,
  buildAgentsMdMarkdown,
  getAiSkillOption,
  isAiSkillExtraId,
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  resolveAgentsMdFilePaths,
  resolveAiSkillsRootPaths,
} from '@/features/ai-extras/model/ai-extras'
import type { ProjectConfig } from '@/shared/lib/project-config'

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

const SKILL_MARKDOWN_PATH_PATTERN = /\/([^/]+)\/SKILL\.md(?:\?raw)?$/

const SKILL_MARKDOWN_MODULES = import.meta.glob(
  './ai-extra-sources/claude-code-java/*/SKILL.md',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
) as Record<string, unknown>

const AI_SKILL_MARKDOWN_BY_DIRECTORY = loadAiSkillMarkdownByDirectoryFromModules(
  SKILL_MARKDOWN_MODULES,
)
const AI_SKILL_MARKDOWN_BY_ID = buildAiSkillMarkdownById(
  AI_SKILL_OPTIONS,
  AI_SKILL_MARKDOWN_BY_DIRECTORY,
)

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

    const skillMarkdown = AI_SKILL_MARKDOWN_BY_ID.get(selectedId)

    if (!skillMarkdown) {
      throw new Error(
        `AI skill markdown not found for "${selectedId}" (directoryName "${skillOption.directoryName}").`,
      )
    }

    for (const skillsRootPath of resolveAiSkillsRootPaths(aiExtrasTarget)) {
      fileMap.set(`${skillsRootPath}/${skillOption.directoryName}/SKILL.md`, skillMarkdown)
    }
  }

  return Array.from(fileMap.entries())
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path))
}

export function loadAiSkillMarkdownByDirectoryFromModules(
  skillMarkdownModules: Record<string, unknown>,
): Map<string, string> {
  const moduleEntries = Object.entries(skillMarkdownModules).sort(([leftPath], [rightPath]) =>
    leftPath.localeCompare(rightPath),
  )

  if (moduleEntries.length === 0) {
    throw new Error(
      'AI skill markdown catalog is empty. Add SKILL.md files under src/server/lib/ai-extra-sources/claude-code-java/.',
    )
  }

  const markdownByDirectory = new Map<string, string>()

  for (const [filePath, value] of moduleEntries) {
    const directoryName = extractSkillDirectoryNameFromModulePath(filePath)
    const markdown = normalizeSkillMarkdown(value, filePath)

    if (markdownByDirectory.has(directoryName)) {
      throw new Error(
        `Duplicate AI skill markdown directoryName "${directoryName}" in "${filePath}".`,
      )
    }

    markdownByDirectory.set(directoryName, markdown)
  }

  return markdownByDirectory
}

export function buildAiSkillMarkdownById(
  skillOptions: readonly AiSkillOption[],
  markdownByDirectory: ReadonlyMap<string, string>,
): Map<AiSkillExtraId, string> {
  const markdownBySkillId = new Map<AiSkillExtraId, string>()

  for (const skillOption of skillOptions) {
    const markdown = markdownByDirectory.get(skillOption.directoryName)

    if (!markdown) {
      throw new Error(
        `AI skill "${skillOption.id}" references directoryName "${skillOption.directoryName}" but no SKILL.md source was found.`,
      )
    }

    markdownBySkillId.set(skillOption.id, markdown)
  }

  return markdownBySkillId
}

function extractSkillDirectoryNameFromModulePath(filePath: string): string {
  const match = filePath.match(SKILL_MARKDOWN_PATH_PATTERN)

  if (!match) {
    throw new Error(`Unsupported AI skill markdown module path "${filePath}".`)
  }

  return match[1] ?? ''
}

function normalizeSkillMarkdown(value: unknown, context: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${context} must resolve to markdown string content.`)
  }

  if (!value.trim()) {
    throw new Error(`${context} resolved to empty markdown content.`)
  }

  return value
}
