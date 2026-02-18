import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import { AI_SKILL_OPTIONS, DEFAULT_AGENTS_MD_PREFERENCES } from '@/features/ai-extras/model/ai-extras'
import type { ProjectConfig } from '@/shared/lib/project-config'

import {
  fetchInitializrProjectPreview,
  InitializrPreviewClientError,
} from './initializr-preview-client'

const baseConfig: ProjectConfig = {
  group: 'com.example',
  artifact: 'demo',
  name: 'demo',
  description: 'Demo project',
  packageName: 'com.example.demo',
  javaVersion: '21',
  springBootVersion: '4.1.0.M1',
  buildTool: 'gradle-project',
  language: 'java',
  packaging: 'jar',
}

const primarySkill = AI_SKILL_OPTIONS[0]

if (!primarySkill) {
  throw new Error('Expected at least one AI skill in the catalog.')
}

describe('fetchInitializrProjectPreview', () => {
  it('normalizes gradle bootVersion before requesting archive', async () => {
    const requestedUrls: URL[] = []
    const zipPayload = await createZipPayload()
    const fetchMock = async (input: URL | RequestInfo) => {
      const requestedUrl = input instanceof URL ? input : new URL(String(input))
      requestedUrls.push(requestedUrl)

      return new Response(zipPayload, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })
    }

    const files = await fetchInitializrProjectPreview({
      config: baseConfig,
      selectedDependencyIds: [],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      fetch: fetchMock as typeof fetch,
    })

    expect(requestedUrls).toHaveLength(1)
    expect(requestedUrls[0]?.searchParams.get('bootVersion')).toBe('4.1.0-M1')
    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'build.gradle',
          binary: false,
        }),
      ]),
    )
  })

  it('retries once without bootVersion after non-OK response', async () => {
    const requestedUrls: URL[] = []
    const zipPayload = await createZipPayload()
    const fetchMock = async (input: URL | RequestInfo) => {
      const requestedUrl = input instanceof URL ? input : new URL(String(input))
      requestedUrls.push(requestedUrl)

      if (requestedUrls.length === 1) {
        return new Response('upstream failed', { status: 500 })
      }

      return new Response(zipPayload, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })
    }

    const files = await fetchInitializrProjectPreview({
      config: {
        ...baseConfig,
        springBootVersion: '4.1.0.BUILD-SNAPSHOT',
      },
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      fetch: fetchMock as typeof fetch,
    })

    expect(requestedUrls).toHaveLength(2)
    expect(requestedUrls[0]?.searchParams.get('bootVersion')).toBe('4.1.0-SNAPSHOT')
    expect(requestedUrls[1]?.searchParams.has('bootVersion')).toBe(false)
    expect(files.length).toBeGreaterThan(0)
  })

  it('throws typed upstream error when retry without bootVersion also fails', async () => {
    let requestCount = 0
    const fetchMock = async () => {
      requestCount += 1

      return new Response('still failing', { status: 503 })
    }

    await expect(
      fetchInitializrProjectPreview({
        config: baseConfig,
        selectedDependencyIds: [],
        selectedAiExtraIds: [],
        agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
        aiExtrasTarget: 'agents',
        fetch: fetchMock as typeof fetch,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InitializrPreviewClientError>>({
        code: 'UPSTREAM_ERROR',
        status: 503,
      }),
    )

    expect(requestCount).toBe(2)
  })

  it('includes AI extra markdown files in preview snapshot when selected', async () => {
    const zipPayload = await createZipPayload()
    const fetchMock = async () =>
      new Response(zipPayload, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })

    const files = await fetchInitializrProjectPreview({
      config: baseConfig,
      selectedDependencyIds: [],
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      fetch: fetchMock as typeof fetch,
    })

    const paths = files.map((file) => file.path)

    expect(paths).toContain('AGENTS.md')
    expect(paths).toContain(`.agents/skills/${primarySkill.directoryName}/SKILL.md`)
  })

  it('includes CLAUDE.md and .claude skills for claude target', async () => {
    const zipPayload = await createZipPayload()
    const fetchMock = async () =>
      new Response(zipPayload, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })

    const files = await fetchInitializrProjectPreview({
      config: baseConfig,
      selectedDependencyIds: [],
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'claude',
      fetch: fetchMock as typeof fetch,
    })

    const paths = files.map((file) => file.path)

    expect(paths).toContain('CLAUDE.md')
    expect(paths).toContain(`.claude/skills/${primarySkill.directoryName}/SKILL.md`)
    expect(paths).not.toContain('AGENTS.md')
    expect(paths).not.toContain(`.agents/skills/${primarySkill.directoryName}/SKILL.md`)
  })

  it('duplicates files across both targets when target is both', async () => {
    const zipPayload = await createZipPayload()
    const fetchMock = async () =>
      new Response(zipPayload, {
        status: 200,
        headers: {
          'content-type': 'application/zip',
        },
      })

    const files = await fetchInitializrProjectPreview({
      config: baseConfig,
      selectedDependencyIds: [],
      selectedAiExtraIds: ['agents-md', primarySkill.id],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'both',
      fetch: fetchMock as typeof fetch,
    })

    const paths = files.map((file) => file.path)

    expect(paths).toContain('AGENTS.md')
    expect(paths).toContain('CLAUDE.md')
    expect(paths).toContain(`.agents/skills/${primarySkill.directoryName}/SKILL.md`)
    expect(paths).toContain(`.claude/skills/${primarySkill.directoryName}/SKILL.md`)
  })
})

async function createZipPayload(): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('demo/build.gradle', 'plugins { id "java" }')

  return zip.generateAsync({ type: 'uint8array' })
}
