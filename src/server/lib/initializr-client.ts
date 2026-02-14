export const INITIALIZR_METADATA_URL = 'https://start.spring.io/metadata/client'

export type InitializrOption = {
  id: string
  name: string
  description?: string
  default: boolean
}

export type InitializrDependency = InitializrOption & {
  group: string
}

export type InitializrMetadata = {
  dependencies: InitializrDependency[]
  javaVersions: InitializrOption[]
  springBootVersions: InitializrOption[]
}

export type FetchInitializrMetadataOptions = {
  signal?: AbortSignal
  fetch?: typeof fetch
}

type UpstreamOption = {
  id?: unknown
  name?: unknown
  description?: unknown
  default?: unknown
}

type UpstreamGroup = {
  name?: unknown
  values?: unknown
}

type UpstreamMetadata = {
  dependencies?: {
    values?: unknown
  }
  javaVersion?: {
    values?: unknown
  }
  bootVersion?: {
    values?: unknown
  }
}

export class InitializrClientError extends Error {
  constructor(
    message: string,
    readonly code: 'UPSTREAM_ERROR' | 'INVALID_RESPONSE',
    readonly status?: number,
  ) {
    super(message)
    this.name = 'InitializrClientError'
  }
}

export function normalizeInitializrMetadata(input: unknown): InitializrMetadata {
  const metadata = (input ?? {}) as UpstreamMetadata

  return {
    dependencies: normalizeDependencies(metadata.dependencies?.values),
    javaVersions: normalizeOptions(metadata.javaVersion?.values),
    springBootVersions: normalizeOptions(metadata.bootVersion?.values),
  }
}

export async function fetchInitializrMetadata(
  options: FetchInitializrMetadataOptions = {},
): Promise<InitializrMetadata> {
  const fetchImpl = options.fetch ?? fetch

  let response: Response

  try {
    response = await fetchImpl(INITIALIZR_METADATA_URL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
      signal: options.signal,
    })
  } catch {
    throw new InitializrClientError(
      'Unable to reach Spring Initializr metadata service.',
      'UPSTREAM_ERROR',
    )
  }

  if (!response.ok) {
    throw new InitializrClientError(
      'Spring Initializr metadata request failed.',
      'UPSTREAM_ERROR',
      response.status,
    )
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new InitializrClientError(
      'Spring Initializr metadata response was not valid JSON.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  return normalizeInitializrMetadata(payload)
}

function normalizeDependencies(input: unknown): InitializrDependency[] {
  const groups = asArray<UpstreamGroup>(input)
  const dependencies: InitializrDependency[] = []

  for (const group of groups) {
    const groupName = typeof group.name === 'string' ? group.name : 'General'

    for (const option of asArray<UpstreamOption>(group.values)) {
      const normalized = normalizeOption(option)

      if (normalized) {
        dependencies.push({ ...normalized, group: groupName })
      }
    }
  }

  return dependencies
}

function normalizeOptions(input: unknown): InitializrOption[] {
  return asArray<UpstreamOption>(input)
    .map((option) => normalizeOption(option))
    .filter((option): option is InitializrOption => option !== null)
}

function normalizeOption(input: UpstreamOption): InitializrOption | null {
  if (typeof input.id !== 'string' || typeof input.name !== 'string') {
    return null
  }

  return {
    id: input.id,
    name: input.name,
    description: typeof input.description === 'string' ? input.description : undefined,
    default: input.default === true,
  }
}

function asArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : []
}
