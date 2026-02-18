import { describe, expect, it } from 'vitest'

import { AI_SKILL_OPTIONS, DEFAULT_AGENTS_MD_PREFERENCES } from '@/features/ai-extras/model/ai-extras'
import { DEFAULT_PROJECT_CONFIG } from '@/shared/lib/project-config'

import {
  buildAiSkillMarkdownById,
  loadAiSkillMarkdownByDirectoryFromModules,
  resolveAiExtraFiles,
} from './ai-extra-files'

describe('ai extra files skill catalog integrity', () => {
  it('resolves one SKILL.md file per selected catalog skill', () => {
    const selectedSkillIds = AI_SKILL_OPTIONS.map((skill) => skill.id)

    const files = resolveAiExtraFiles({
      config: DEFAULT_PROJECT_CONFIG,
      selectedAiExtraIds: selectedSkillIds,
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    const skillPaths = files
      .map((file) => file.path)
      .filter((path) => path.startsWith('.agents/skills/') && path.endsWith('/SKILL.md'))

    expect(skillPaths).toHaveLength(AI_SKILL_OPTIONS.length)

    for (const skill of AI_SKILL_OPTIONS) {
      expect(skillPaths).toContain(`.agents/skills/${skill.directoryName}/SKILL.md`)
    }
  })
})

describe('buildAiSkillMarkdownById', () => {
  it('throws when a catalog skill has no markdown source', () => {
    expect(() =>
      buildAiSkillMarkdownById(
        [
          {
            id: 'skill-custom',
            label: 'Custom',
            description: 'Custom description',
            directoryName: 'custom',
            sortOrder: 10,
          },
        ],
        new Map(),
      ),
    ).toThrow(
      'AI skill "skill-custom" references directoryName "custom" but no SKILL.md source was found.',
    )
  })
})

describe('loadAiSkillMarkdownByDirectoryFromModules', () => {
  it('extracts directory names from markdown module paths', () => {
    const byDirectory = loadAiSkillMarkdownByDirectoryFromModules({
      './ai-extra-sources/claude-code-java/zeta/SKILL.md?raw': '# Zeta',
      './ai-extra-sources/claude-code-java/alpha/SKILL.md?raw': '# Alpha',
    })

    expect(Array.from(byDirectory.keys())).toEqual(['alpha', 'zeta'])
    expect(byDirectory.get('alpha')).toBe('# Alpha')
    expect(byDirectory.get('zeta')).toBe('# Zeta')
  })
})
