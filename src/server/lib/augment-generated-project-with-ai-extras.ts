import JSZip from 'jszip'

import type { AgentsMdPreferences, AiExtrasTarget } from '@/lib/ai-extras'
import { normalizeAiExtrasTarget, normalizeSelectedAiExtraIds } from '@/lib/ai-extras'
import type { ProjectConfig } from '@/lib/project-config'

import { resolveAiExtraFiles } from './ai-extra-files'

type AugmentGeneratedProjectWithAiExtrasInput = {
  archiveBytes: Uint8Array
  config: ProjectConfig
  selectedAiExtraIds: string[]
  agentsMdPreferences: Partial<AgentsMdPreferences> | undefined
  aiExtrasTarget: AiExtrasTarget | undefined
}

export async function augmentGeneratedProjectWithAiExtras(
  input: AugmentGeneratedProjectWithAiExtrasInput,
): Promise<Uint8Array> {
  const selectedAiExtraIds = normalizeSelectedAiExtraIds(input.selectedAiExtraIds)
  const aiExtrasTarget = normalizeAiExtrasTarget(input.aiExtrasTarget)

  if (selectedAiExtraIds.length === 0) {
    return cloneBytes(input.archiveBytes)
  }

  const zip = await JSZip.loadAsync(input.archiveBytes)
  const rootPrefix = detectRootPrefix(zip)
  const filesToInject = resolveAiExtraFiles({
    config: input.config,
    selectedAiExtraIds,
    agentsMdPreferences: input.agentsMdPreferences,
    aiExtrasTarget,
  })

  for (const file of filesToInject) {
    const relativePath = normalizeRelativePath(file.path)

    if (!relativePath) {
      continue
    }

    zip.file(`${rootPrefix}${relativePath}`, file.content)
  }

  return zip.generateAsync({ type: 'uint8array' })
}

function detectRootPrefix(zip: JSZip): string {
  const rootSegments = new Set<string>()

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue
    }

    const normalizedPath = normalizeRelativePath(entry.name)

    if (!normalizedPath) {
      continue
    }

    const slashIndex = normalizedPath.indexOf('/')

    if (slashIndex === -1) {
      return ''
    }

    rootSegments.add(normalizedPath.slice(0, slashIndex))

    if (rootSegments.size > 1) {
      return ''
    }
  }

  const [singleRoot] = Array.from(rootSegments)

  return singleRoot ? `${singleRoot}/` : ''
}

function normalizeRelativePath(path: string): string {
  const segments = path
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0 || segments.some((segment) => segment === '..')) {
    return ''
  }

  return segments.join('/')
}

function cloneBytes(bytes: Uint8Array): Uint8Array {
  const cloned = new Uint8Array(bytes.byteLength)
  cloned.set(bytes)

  return cloned
}
