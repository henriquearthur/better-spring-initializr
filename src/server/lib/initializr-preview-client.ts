import { createHash } from 'node:crypto'
import JSZip from 'jszip'

import type { ProjectConfig } from '@/lib/project-config'

const INITIALIZR_PROJECT_URL = 'https://start.spring.io/starter.zip'

export type ProjectPreviewInput = {
  config: ProjectConfig
  selectedDependencyIds: string[]
}

export type GeneratedProjectFile = {
  path: string
  size: number
  binary: boolean
  hash: string
  content?: string
}

export type FetchInitializrProjectPreviewOptions = ProjectPreviewInput & {
  signal?: AbortSignal
  fetch?: typeof fetch
}

export class InitializrPreviewClientError extends Error {
  constructor(
    message: string,
    readonly code: 'UPSTREAM_ERROR' | 'INVALID_ARCHIVE',
    readonly status?: number,
  ) {
    super(message)
    this.name = 'InitializrPreviewClientError'
  }
}

export async function fetchInitializrProjectPreview(
  options: FetchInitializrProjectPreviewOptions,
): Promise<GeneratedProjectFile[]> {
  const fetchImpl = options.fetch ?? fetch
  const dependencies = Array.from(
    new Set(options.selectedDependencyIds.map((dependencyId) => dependencyId.trim())),
  ).filter(Boolean)

  let response: Response

  try {
    response = await fetchImpl(buildPreviewUrl(options.config, dependencies), {
      method: 'GET',
      headers: {
        accept: 'application/zip, application/octet-stream',
      },
      signal: options.signal,
    })
  } catch {
    throw new InitializrPreviewClientError(
      'Unable to reach Spring Initializr preview endpoint.',
      'UPSTREAM_ERROR',
    )
  }

  if (!response.ok) {
    throw new InitializrPreviewClientError(
      'Spring Initializr preview request failed.',
      'UPSTREAM_ERROR',
      response.status,
    )
  }

  let zip: JSZip

  try {
    zip = await JSZip.loadAsync(await response.arrayBuffer())
  } catch {
    throw new InitializrPreviewClientError(
      'Spring Initializr preview archive could not be decoded.',
      'INVALID_ARCHIVE',
      response.status,
    )
  }

  const files: GeneratedProjectFile[] = []

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue
    }

    const bytes = new Uint8Array(await entry.async('uint8array'))
    const normalizedPath = normalizeArchivePath(entry.name)
    const decodedContent = decodeUtf8IfText(bytes)

    files.push({
      path: normalizedPath,
      size: bytes.byteLength,
      binary: decodedContent === undefined,
      hash: createHash('sha256').update(bytes).digest('hex'),
      content: decodedContent,
    })
  }

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

function buildPreviewUrl(config: ProjectConfig, selectedDependencyIds: string[]): URL {
  const url = new URL(INITIALIZR_PROJECT_URL)

  url.searchParams.set('type', config.buildTool)
  url.searchParams.set('language', config.language)
  url.searchParams.set('bootVersion', config.springBootVersion)
  url.searchParams.set('baseDir', config.name)
  url.searchParams.set('groupId', config.group)
  url.searchParams.set('artifactId', config.artifact)
  url.searchParams.set('name', config.name)
  url.searchParams.set('description', config.description)
  url.searchParams.set('packageName', config.packageName)
  url.searchParams.set('packaging', config.packaging)
  url.searchParams.set('javaVersion', config.javaVersion)

  if (selectedDependencyIds.length > 0) {
    url.searchParams.set('dependencies', selectedDependencyIds.join(','))
  }

  return url
}

function normalizeArchivePath(path: string): string {
  const index = path.indexOf('/')

  if (index === -1) {
    return path
  }

  return path.slice(index + 1)
}

function decodeUtf8IfText(bytes: Uint8Array): string | undefined {
  if (bytes.byteLength === 0) {
    return ''
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)

    return decoded.includes('\u0000') ? undefined : decoded
  } catch {
    return undefined
  }
}
