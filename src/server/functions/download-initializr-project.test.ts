import JSZip from 'jszip'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AI_SKILL_OPTIONS, DEFAULT_AGENTS_MD_PREFERENCES } from '@/lib/ai-extras'

import * as generateClient from '../lib/initializr-generate-client'
import {
  InitializrGenerateClientError,
} from '../lib/initializr-generate-client'
import { downloadInitializrProjectFromBff } from './download-initializr-project'

const configFixture = {
  group: 'com.example',
  artifact: 'demo',
  name: 'demo',
  description: 'Demo project',
  packageName: 'com.example.demo',
  javaVersion: '21',
  springBootVersion: '3.4.0',
  buildTool: 'maven-project' as const,
  language: 'java' as const,
  packaging: 'jar' as const,
}

const primarySkill = AI_SKILL_OPTIONS[0]

if (!primarySkill) {
  throw new Error('Expected at least one AI skill in the catalog.')
}

describe('downloadInitializrProjectFromBff', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns encoded archive metadata and builds params for upstream ZIP request', async () => {
    const fetchSpy = vi
      .spyOn(generateClient, 'fetchInitializrZip')
      .mockResolvedValue({
        bytes: new Uint8Array([80, 75, 3, 4]),
        contentType: 'application/zip',
        suggestedFilename: 'demo.zip',
      })

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web', 'data-jpa'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const fetchInput = fetchSpy.mock.calls[0][0]
    const searchParams =
      fetchInput.params instanceof URLSearchParams
        ? fetchInput.params
        : new URLSearchParams(Array.from(fetchInput.params, ([key, value]) => [key, value]))

    expect(searchParams.get('type')).toBe('maven-project')
    expect(searchParams.get('dependencies')).toBe('web,data-jpa')

    expect(result).toEqual({
      ok: true,
      archive: {
        base64: 'UEsDBA==',
        contentType: 'application/zip',
        filename: 'demo.zip',
      },
    })
  })

  it('returns sanitized, retryable error response when upstream client fails', async () => {
    vi.spyOn(generateClient, 'fetchInitializrZip').mockRejectedValue(
      new InitializrGenerateClientError('upstream status 500 with details', 'UPSTREAM_ERROR', 500),
    )

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'PROJECT_DOWNLOAD_UNAVAILABLE',
        message:
          'Spring Initializr project download is temporarily unavailable. Please try again in a moment.',
        retryable: true,
      },
    })
  })

  it('retries once without bootVersion when first archive request fails', async () => {
    const fetchSpy = vi
      .spyOn(generateClient, 'fetchInitializrZip')
      .mockRejectedValueOnce(
        new InitializrGenerateClientError('upstream rejected version', 'UPSTREAM_ERROR', 500),
      )
      .mockResolvedValueOnce({
        bytes: new Uint8Array([80, 75, 3, 4]),
        contentType: 'application/zip',
        suggestedFilename: 'demo.zip',
      })

    const result = await downloadInitializrProjectFromBff({
      config: {
        ...configFixture,
        buildTool: 'gradle-project',
        springBootVersion: '3.5.10.RELEASE',
      },
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const firstSearchParams = new URLSearchParams(
      Array.from(fetchSpy.mock.calls[0][0].params, ([key, value]) => [key, value]),
    )
    const secondSearchParams = new URLSearchParams(
      Array.from(fetchSpy.mock.calls[1][0].params, ([key, value]) => [key, value]),
    )

    expect(firstSearchParams.get('bootVersion')).toBe('3.5.10')
    expect(secondSearchParams.has('bootVersion')).toBe(false)
    expect(result).toEqual({
      ok: true,
      archive: {
        base64: 'UEsDBA==',
        contentType: 'application/zip',
        filename: 'demo.zip',
      },
    })
  })

  it('does not retry when request params do not include bootVersion', async () => {
    const fetchSpy = vi.spyOn(generateClient, 'fetchInitializrZip').mockRejectedValue(
      new InitializrGenerateClientError('upstream rejected request', 'UPSTREAM_ERROR', 500),
    )

    const result = await downloadInitializrProjectFromBff({
      config: {
        ...configFixture,
        buildTool: 'gradle-project',
        springBootVersion: '   ',
      },
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'PROJECT_DOWNLOAD_UNAVAILABLE',
        message:
          'Spring Initializr project download is temporarily unavailable. Please try again in a moment.',
        retryable: true,
      },
    })
  })

  it('injects AGENTS.md into the generated archive when agents-md extra is selected', async () => {
    vi.spyOn(generateClient, 'fetchInitializrZip').mockResolvedValue({
      bytes: await createFixtureArchiveBytes(),
      contentType: 'application/zip',
      suggestedFilename: 'demo.zip',
    })

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: ['agents-md'],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: false,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: false,
        includeRunRelevantTestsGuidance: false,
        includeTaskScopeDisciplineGuidance: false,
      },
      aiExtrasTarget: 'agents',
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected successful download response')
    }

    const archiveFiles = await listArchiveFiles(result.archive.base64)

    expect(archiveFiles).toContain('AGENTS.md')
    const agentsContent = await readArchiveFileContent(result.archive.base64, 'AGENTS.md')
    expect(agentsContent).not.toContain(configFixture.artifact)
    expect(agentsContent).not.toContain('## Git Workflow')
  })

  it('injects skill markdown when a core-java skill extra is selected', async () => {
    vi.spyOn(generateClient, 'fetchInitializrZip').mockResolvedValue({
      bytes: await createFixtureArchiveBytes(),
      contentType: 'application/zip',
      suggestedFilename: 'demo.zip',
    })

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected successful download response')
    }

    const archiveFiles = await listArchiveFiles(result.archive.base64)

    expect(archiveFiles).toContain(
      `.agents/skills/${primarySkill.directoryName}/SKILL.md`,
    )
  })

  it('injects CLAUDE.md and .claude skills when target is claude', async () => {
    vi.spyOn(generateClient, 'fetchInitializrZip').mockResolvedValue({
      bytes: await createFixtureArchiveBytes(),
      contentType: 'application/zip',
      suggestedFilename: 'demo.zip',
    })

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'claude',
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected successful download response')
    }

    const archiveFiles = await listArchiveFiles(result.archive.base64)

    expect(archiveFiles).toContain('CLAUDE.md')
    expect(archiveFiles).toContain(
      `.claude/skills/${primarySkill.directoryName}/SKILL.md`,
    )
    expect(archiveFiles).not.toContain('AGENTS.md')
    expect(archiveFiles).not.toContain(
      `.agents/skills/${primarySkill.directoryName}/SKILL.md`,
    )
  })

  it('duplicates guidance and skills in both target mode', async () => {
    vi.spyOn(generateClient, 'fetchInitializrZip').mockResolvedValue({
      bytes: await createFixtureArchiveBytes(),
      contentType: 'application/zip',
      suggestedFilename: 'demo.zip',
    })

    const result = await downloadInitializrProjectFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'both',
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected successful download response')
    }

    const archiveFiles = await listArchiveFiles(result.archive.base64)

    expect(archiveFiles).toContain('AGENTS.md')
    expect(archiveFiles).toContain('CLAUDE.md')
    expect(archiveFiles).toContain(
      `.agents/skills/${primarySkill.directoryName}/SKILL.md`,
    )
    expect(archiveFiles).toContain(
      `.claude/skills/${primarySkill.directoryName}/SKILL.md`,
    )
  })
})

async function createFixtureArchiveBytes(): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('demo/README.md', '# demo')

  return zip.generateAsync({ type: 'uint8array' })
}

async function listArchiveFiles(archiveBase64: string): Promise<string[]> {
  const zip = await JSZip.loadAsync(Buffer.from(archiveBase64, 'base64'))

  return Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => normalizeArchivePath(entry.name))
    .sort((left, right) => left.localeCompare(right))
}

function normalizeArchivePath(path: string): string {
  const slashIndex = path.indexOf('/')

  if (slashIndex === -1) {
    return path
  }

  return path.slice(slashIndex + 1)
}

async function readArchiveFileContent(archiveBase64: string, normalizedPath: string): Promise<string> {
  const zip = await JSZip.loadAsync(Buffer.from(archiveBase64, 'base64'))
  const matchedEntry = Object.values(zip.files).find((entry) => {
    if (entry.dir) {
      return false
    }

    return normalizeArchivePath(entry.name) === normalizedPath
  })

  if (!matchedEntry) {
    throw new Error(`Archive file not found: ${normalizedPath}`)
  }

  return matchedEntry.async('text')
}
