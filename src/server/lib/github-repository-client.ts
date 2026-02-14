const GITHUB_API_BASE_URL = 'https://api.github.com'

const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9._-]+$/
const OWNER_LOGIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/

export type GitHubRepositoryVisibility = 'public' | 'private'

export type RepositoryFileEntry = {
  path: string
  base64Content: string
  mode?: '100644' | '100755'
}

export type CreateRepositoryInput = {
  accessToken: string
  authenticatedUserLogin: string
  owner: string
  name: string
  description?: string
  visibility: GitHubRepositoryVisibility
}

export type CreatedRepository = {
  owner: string
  name: string
  fullName: string
  htmlUrl: string
  defaultBranch: string
}

export type CreateInitialCommitInput = {
  accessToken: string
  owner: string
  repository: string
  files: RepositoryFileEntry[]
  message: string
}

export class GitHubRepositoryClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_OWNER'
      | 'INVALID_REPOSITORY_NAME'
      | 'REPOSITORY_ALREADY_EXISTS'
      | 'PERMISSION_DENIED'
      | 'INVALID_RESPONSE'
      | 'UPSTREAM_ERROR'
      | 'COMMIT_FAILED',
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GitHubRepositoryClientError'
  }
}

export async function createRepository(input: CreateRepositoryInput): Promise<CreatedRepository> {
  const owner = normalizeOwner(input.owner)
  const repositoryName = normalizeRepositoryName(input.name)

  ensureOwner(owner)
  ensureRepositoryName(repositoryName)

  const endpoint =
    owner.localeCompare(input.authenticatedUserLogin, undefined, { sensitivity: 'accent' }) === 0
      ? '/user/repos'
      : `/orgs/${encodeURIComponent(owner)}/repos`

  const response = await requestGitHub(endpoint, {
    method: 'POST',
    accessToken: input.accessToken,
    body: {
      name: repositoryName,
      description: input.description?.trim() || undefined,
      private: input.visibility === 'private',
      auto_init: false,
    },
  })

  if (!response.ok) {
    throw await mapCreateRepositoryError(response)
  }

  const payload = await parseJson(response)

  const payloadOwner = isRecord(payload.owner) ? payload.owner : null

  if (
    typeof payloadOwner?.login !== 'string' ||
    typeof payload.name !== 'string' ||
    typeof payload.full_name !== 'string' ||
    typeof payload.html_url !== 'string'
  ) {
    throw new GitHubRepositoryClientError(
      'GitHub create repository response payload was invalid.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  return {
    owner: payloadOwner.login,
    name: payload.name,
    fullName: payload.full_name,
    htmlUrl: payload.html_url,
    defaultBranch:
      typeof payload.default_branch === 'string' && payload.default_branch.length > 0
        ? payload.default_branch
        : 'main',
  }
}

export async function createInitialCommit(input: CreateInitialCommitInput): Promise<{ commitSha: string }> {
  if (input.files.length === 0) {
    throw new GitHubRepositoryClientError(
      'Repository archive did not contain commitable files.',
      'COMMIT_FAILED',
    )
  }

  const blobs = await Promise.all(
    input.files.map(async (file) => {
      const blobResponse = await requestGitHub(
        `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/git/blobs`,
        {
          method: 'POST',
          accessToken: input.accessToken,
          body: {
            content: file.base64Content,
            encoding: 'base64',
          },
        },
      )

      if (!blobResponse.ok) {
        throw new GitHubRepositoryClientError(
          'Unable to create repository blob in GitHub.',
          'COMMIT_FAILED',
          blobResponse.status,
        )
      }

      const blobPayload = await parseJson(blobResponse)

      if (typeof blobPayload.sha !== 'string' || blobPayload.sha.length === 0) {
        throw new GitHubRepositoryClientError(
          'GitHub blob response payload was invalid.',
          'INVALID_RESPONSE',
          blobResponse.status,
        )
      }

      return {
        sha: blobPayload.sha,
        path: file.path,
        mode: file.mode ?? '100644',
      }
    }),
  )

  const treeResponse = await requestGitHub(
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/git/trees`,
    {
      method: 'POST',
      accessToken: input.accessToken,
      body: {
        tree: blobs.map((blob) => ({
          path: blob.path,
          mode: blob.mode,
          type: 'blob',
          sha: blob.sha,
        })),
      },
    },
  )

  if (!treeResponse.ok) {
    throw new GitHubRepositoryClientError(
      'Unable to create repository tree in GitHub.',
      'COMMIT_FAILED',
      treeResponse.status,
    )
  }

  const treePayload = await parseJson(treeResponse)

  if (typeof treePayload.sha !== 'string' || treePayload.sha.length === 0) {
    throw new GitHubRepositoryClientError(
      'GitHub tree response payload was invalid.',
      'INVALID_RESPONSE',
      treeResponse.status,
    )
  }

  const commitResponse = await requestGitHub(
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/git/commits`,
    {
      method: 'POST',
      accessToken: input.accessToken,
      body: {
        message: input.message,
        tree: treePayload.sha,
        parents: [],
      },
    },
  )

  if (!commitResponse.ok) {
    throw new GitHubRepositoryClientError(
      'Unable to create repository commit in GitHub.',
      'COMMIT_FAILED',
      commitResponse.status,
    )
  }

  const commitPayload = await parseJson(commitResponse)

  if (typeof commitPayload.sha !== 'string' || commitPayload.sha.length === 0) {
    throw new GitHubRepositoryClientError(
      'GitHub commit response payload was invalid.',
      'INVALID_RESPONSE',
      commitResponse.status,
    )
  }

  const updateRefResponse = await requestGitHub(
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/git/refs/heads/main`,
    {
      method: 'PATCH',
      accessToken: input.accessToken,
      body: {
        sha: commitPayload.sha,
        force: false,
      },
    },
  )

  if (updateRefResponse.status === 404) {
    const createRefResponse = await requestGitHub(
      `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/git/refs`,
      {
        method: 'POST',
        accessToken: input.accessToken,
        body: {
          ref: 'refs/heads/main',
          sha: commitPayload.sha,
        },
      },
    )

    if (!createRefResponse.ok) {
      throw new GitHubRepositoryClientError(
        'Unable to create repository main branch reference in GitHub.',
        'COMMIT_FAILED',
        createRefResponse.status,
      )
    }

    return { commitSha: commitPayload.sha }
  }

  if (!updateRefResponse.ok) {
    throw new GitHubRepositoryClientError(
      'Unable to update repository main branch reference in GitHub.',
      'COMMIT_FAILED',
      updateRefResponse.status,
    )
  }

  return { commitSha: commitPayload.sha }
}

async function mapCreateRepositoryError(response: Response): Promise<GitHubRepositoryClientError> {
  if (response.status === 401 || response.status === 403) {
    return new GitHubRepositoryClientError(
      'GitHub rejected repository creation due to missing permissions.',
      'PERMISSION_DENIED',
      response.status,
    )
  }

  if (response.status === 422) {
    const payload = await parseJson(response)
    const message = typeof payload.message === 'string' ? payload.message : ''
    const errors = Array.isArray(payload.errors) ? payload.errors : []
    const duplicateError = errors.some(
      (error) =>
        isRecord(error) &&
        error.resource === 'Repository' &&
        error.field === 'name' &&
        error.code === 'custom',
    )

    if (
      duplicateError ||
      message.toLowerCase().includes('name already exists') ||
      message.toLowerCase().includes('already exists on this account')
    ) {
      return new GitHubRepositoryClientError(
        'A repository with this name already exists for the selected owner.',
        'REPOSITORY_ALREADY_EXISTS',
        response.status,
      )
    }
  }

  return new GitHubRepositoryClientError(
    'GitHub repository creation request failed.',
    'UPSTREAM_ERROR',
    response.status,
  )
}

type RequestOptions = {
  method: 'POST' | 'PATCH' | 'GET'
  accessToken: string
  body?: Record<string, unknown>
}

async function requestGitHub(path: string, options: RequestOptions): Promise<Response> {
  try {
    return await fetch(`${GITHUB_API_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${options.accessToken}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new GitHubRepositoryClientError(
      'Unable to reach GitHub repository API endpoints.',
      'UPSTREAM_ERROR',
    )
  }
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = (await response.json()) as unknown

    if (!isRecord(payload)) {
      throw new Error('invalid payload shape')
    }

    return payload
  } catch {
    throw new GitHubRepositoryClientError(
      'GitHub API response payload was invalid JSON.',
      'INVALID_RESPONSE',
      response.status,
    )
  }
}

function normalizeOwner(value: string): string {
  return value.trim()
}

function normalizeRepositoryName(value: string): string {
  return value.trim()
}

function ensureOwner(owner: string) {
  if (!OWNER_LOGIN_PATTERN.test(owner)) {
    throw new GitHubRepositoryClientError(
      'Repository owner login is invalid for GitHub API requests.',
      'INVALID_OWNER',
    )
  }
}

function ensureRepositoryName(name: string) {
  if (
    name.length === 0 ||
    name.length > 100 ||
    !REPOSITORY_NAME_PATTERN.test(name) ||
    name.startsWith('.') ||
    name.endsWith('.')
  ) {
    throw new GitHubRepositoryClientError(
      'Repository name does not meet GitHub naming requirements.',
      'INVALID_REPOSITORY_NAME',
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
