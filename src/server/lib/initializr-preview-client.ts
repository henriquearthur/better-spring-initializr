import JSZip from 'jszip'

import { normalizeSpringBootVersionForBuildTool } from '@/lib/initializr-generate-params'
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
  const springBootVersion = normalizeSpringBootVersionForBuildTool(
    options.config.buildTool,
    options.config.springBootVersion,
  )
  const dependencies = Array.from(
    new Set(options.selectedDependencyIds.map((dependencyId) => dependencyId.trim())),
  ).filter(Boolean)

  let response = await requestPreviewArchive({
    fetchImpl,
    config: options.config,
    selectedDependencyIds: dependencies,
    signal: options.signal,
    springBootVersion,
  })

  if (!response.ok && springBootVersion) {
    response = await requestPreviewArchive({
      fetchImpl,
      config: options.config,
      selectedDependencyIds: dependencies,
      signal: options.signal,
      springBootVersion: undefined,
    })
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
      hash: await sha256Hex(bytes),
      content: decodedContent,
    })
  }

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

function buildPreviewUrlWithOptions(
  config: ProjectConfig,
  selectedDependencyIds: string[],
  springBootVersion?: string,
): URL {
  const url = new URL(INITIALIZR_PROJECT_URL)

  url.searchParams.set('type', config.buildTool)
  url.searchParams.set('language', config.language)

  if (springBootVersion) {
    url.searchParams.set('bootVersion', springBootVersion)
  }

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

type RequestPreviewArchiveInput = {
  fetchImpl: typeof fetch
  config: ProjectConfig
  selectedDependencyIds: string[]
  signal?: AbortSignal
  springBootVersion?: string
}

async function requestPreviewArchive(input: RequestPreviewArchiveInput): Promise<Response> {
  try {
    return await input.fetchImpl(
      buildPreviewUrlWithOptions(
        input.config,
        input.selectedDependencyIds,
        input.springBootVersion,
      ),
      {
        method: 'GET',
        headers: {
          accept: 'application/zip, application/octet-stream',
        },
        signal: input.signal,
      },
    )
  } catch {
    throw new InitializrPreviewClientError(
      'Unable to reach Spring Initializr preview endpoint.',
      'UPSTREAM_ERROR',
    )
  }
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

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digestInput = new Uint8Array(bytes.byteLength)
  digestInput.set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', digestInput.buffer)

  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  )
}
