import { createServerFn } from '@tanstack/react-start'

import {
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  type AgentsMdPreferences,
  type AiExtraId,
  type AiExtrasTarget,
} from '@/lib/ai-extras'

import type { DownloadInitializrProjectInput } from './download-initializr-project'
import { downloadInitializrProjectFromBff } from './download-initializr-project'
import {
  createInitialCommit,
  createRepository,
  GitHubRepositoryClientError,
  type GitHubRepositoryVisibility,
} from '../lib/github-repository-client'
import {
  unpackGeneratedProjectZip,
  UnpackGeneratedProjectError,
} from '../lib/unpack-generated-project'

export type PushProjectToGitHubInput = {
  config: DownloadInitializrProjectInput['config']
  selectedDependencyIds: string[]
  selectedAiExtraIds: AiExtraId[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
  owner: string
  repositoryName: string
  visibility: GitHubRepositoryVisibility
  description?: string
}

type PushProjectToGitHubErrorCode =
  | 'GITHUB_AUTH_REQUIRED'
  | 'INVALID_REPOSITORY_NAME'
  | 'GITHUB_REPOSITORY_CREATE_FAILED'
  | 'GITHUB_REPOSITORY_PUSH_FAILED'

type PushProjectToGitHubError = {
  code: PushProjectToGitHubErrorCode
  message: string
  retryable: boolean
}

export type PushProjectToGitHubResponse =
  | {
      ok: true
      repositoryUrl: string
      fullName: string
    }
  | {
      ok: false
      error: PushProjectToGitHubError
    }

export const pushProjectToGitHub = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }): Promise<PushProjectToGitHubResponse> =>
    pushProjectToGitHubFromBff(normalizePushInput(data)),
)

export async function pushProjectToGitHubFromBff(
  input: PushProjectToGitHubInput,
): Promise<PushProjectToGitHubResponse> {
  const githubOAuthSession = await import('../lib/github-oauth-session.server')
  const session = await githubOAuthSession.getGitHubSessionCookie()

  if (!session) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_AUTH_REQUIRED',
        message: 'Connect GitHub before creating and pushing a repository.',
        retryable: false,
      },
    }
  }

  const owner = input.owner.trim()
  const repositoryName = input.repositoryName.trim()
  const logContext = {
    owner,
    repositoryName,
    visibility: input.visibility,
    selectedDependencyCount: input.selectedDependencyIds.length,
    selectedAiExtraCount: input.selectedAiExtraIds.length,
    sessionUser: session.user.login,
  }
  const allowedOwners = new Set([
    session.user.login,
    ...session.organizations.map((organization) => organization.login),
  ])

  if (!allowedOwners.has(owner)) {
    console.error('GitHub push aborted: owner not available in OAuth session', {
      ...logContext,
      allowedOwners: Array.from(allowedOwners).sort((left, right) => left.localeCompare(right)),
    })

    return {
      ok: false,
      error: {
        code: 'GITHUB_REPOSITORY_CREATE_FAILED',
        message: 'Selected repository owner is not available for this GitHub session.',
        retryable: false,
      },
    }
  }

  try {
    ensureRepositoryName(repositoryName)
  } catch {
    console.error('GitHub push aborted: invalid repository name', logContext)

    return {
      ok: false,
      error: {
        code: 'INVALID_REPOSITORY_NAME',
        message:
          'Repository name can include letters, numbers, dots, dashes, or underscores.',
        retryable: false,
      },
    }
  }

  const downloadResponse = await downloadInitializrProjectFromBff({
    config: input.config,
    selectedDependencyIds: input.selectedDependencyIds,
    selectedAiExtraIds: input.selectedAiExtraIds,
    agentsMdPreferences: input.agentsMdPreferences,
    aiExtrasTarget: input.aiExtrasTarget,
  })

  if (!downloadResponse.ok) {
    console.error('GitHub push failed: project archive generation failed', {
      ...logContext,
      error: downloadResponse.error,
    })

    return {
      ok: false,
      error: {
        code: 'GITHUB_REPOSITORY_PUSH_FAILED',
        message: 'Unable to prepare generated project archive for GitHub push.',
        retryable: true,
      },
    }
  }

  let files: Awaited<ReturnType<typeof unpackGeneratedProjectZip>>

  try {
    files = await unpackGeneratedProjectZip(downloadResponse.archive.base64)
  } catch (error) {
    console.error('GitHub push failed: unable to unpack generated archive', {
      ...logContext,
      error: formatUnknownError(error),
    })

    if (error instanceof UnpackGeneratedProjectError) {
      return {
        ok: false,
        error: {
          code: 'GITHUB_REPOSITORY_PUSH_FAILED',
          message:
            error.code === 'ARCHIVE_TOO_LARGE'
              ? 'Generated project archive is too large to push automatically.'
              : 'Unable to decode generated project archive for GitHub push.',
          retryable: error.code !== 'ARCHIVE_TOO_LARGE',
        },
      }
    }

    return {
      ok: false,
      error: {
        code: 'GITHUB_REPOSITORY_PUSH_FAILED',
        message: 'Unable to decode generated project archive for GitHub push.',
        retryable: true,
      },
    }
  }

  let repository: Awaited<ReturnType<typeof createRepository>>

  try {
    repository = await createRepository({
      accessToken: session.token.accessToken,
      authenticatedUserLogin: session.user.login,
      owner,
      name: repositoryName,
      description: input.description,
      visibility: input.visibility,
    })
  } catch (error) {
    console.error('GitHub push failed: repository creation failed', {
      ...logContext,
      error: formatUnknownError(error),
    })

    return {
      ok: false,
      error: mapCreateRepositoryError(error),
    }
  }

  try {
    await createInitialCommit({
      accessToken: session.token.accessToken,
      owner: repository.owner,
      repository: repository.name,
      branch: repository.defaultBranch,
      message: 'Initial commit from Better Spring Initializr',
      files: files.map((file) => ({
        path: file.path,
        base64Content: file.base64Content,
      })),
    })
  } catch (error) {
    console.error('GitHub initial commit failed', {
      ...logContext,
      createdRepository: repository.fullName,
      defaultBranch: repository.defaultBranch,
      generatedFileCount: files.length,
      generatedFileSample: files
        .slice(0, 20)
        .map((file) => `${file.path} (${file.size}b)`),
      error: formatUnknownError(error),
    })

    return {
      ok: false,
      error: mapPushRepositoryError(error),
    }
  }

  return {
    ok: true,
    repositoryUrl: repository.htmlUrl,
    fullName: repository.fullName,
  }
}

function mapCreateRepositoryError(error: unknown): PushProjectToGitHubError {
  if (error instanceof GitHubRepositoryClientError) {
    if (error.code === 'INVALID_REPOSITORY_NAME') {
      return {
        code: 'INVALID_REPOSITORY_NAME',
        message:
          'Repository name can include letters, numbers, dots, dashes, or underscores.',
        retryable: false,
      }
    }

    if (error.code === 'REPOSITORY_ALREADY_EXISTS') {
      return {
        code: 'GITHUB_REPOSITORY_CREATE_FAILED',
        message: 'Repository name already exists for the selected owner.',
        retryable: false,
      }
    }

    if (error.code === 'PERMISSION_DENIED') {
      return {
        code: 'GITHUB_REPOSITORY_CREATE_FAILED',
        message: 'GitHub permissions do not allow repository creation for this owner.',
        retryable: false,
      }
    }
  }

  return {
    code: 'GITHUB_REPOSITORY_CREATE_FAILED',
    message: 'Unable to create repository on GitHub right now. Please try again.',
    retryable: true,
  }
}

function mapPushRepositoryError(error: unknown): PushProjectToGitHubError {
  if (error instanceof GitHubRepositoryClientError) {
    if (error.status === 401 || error.status === 403) {
      return {
        code: 'GITHUB_REPOSITORY_PUSH_FAILED',
        message:
          'Repository was created, but GitHub denied commit permissions for this repository/branch.',
        retryable: false,
      }
    }

    if (error.status === 422) {
      return {
        code: 'GITHUB_REPOSITORY_PUSH_FAILED',
        message:
          'Repository was created, but GitHub rejected the initial branch update. Check branch rulesets/protection and retry.',
        retryable: false,
      }
    }

    return {
      code: 'GITHUB_REPOSITORY_PUSH_FAILED',
      message: 'Repository was created, but initial commit push failed. Please retry push.',
      retryable: true,
    }
  }

  return {
    code: 'GITHUB_REPOSITORY_PUSH_FAILED',
    message: 'Repository was created, but initial commit push failed. Please retry push.',
    retryable: true,
  }
}

function formatUnknownError(error: unknown): Record<string, unknown> {
  if (error instanceof GitHubRepositoryClientError) {
    return {
      name: error.name,
      code: error.code,
      status: error.status,
      message: error.message,
      context: error.context,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    value: String(error),
  }
}

function normalizePushInput(input: unknown): PushProjectToGitHubInput {
  if (!isObject(input)) {
    throw new Error('Invalid push payload.')
  }

  if (
    !isProjectConfig(input.config) ||
    !Array.isArray(input.selectedDependencyIds) ||
    typeof input.owner !== 'string' ||
    typeof input.repositoryName !== 'string' ||
    (input.visibility !== 'public' && input.visibility !== 'private')
  ) {
    throw new Error('Invalid push payload.')
  }

  return {
    config: input.config,
    selectedDependencyIds: input.selectedDependencyIds.filter(
      (dependencyId): dependencyId is string =>
        typeof dependencyId === 'string' && dependencyId.trim().length > 0,
    ),
    selectedAiExtraIds: normalizeSelectedAiExtraIds(
      Array.isArray(input.selectedAiExtraIds)
        ? input.selectedAiExtraIds.filter(
            (extraId): extraId is string =>
              typeof extraId === 'string' && extraId.trim().length > 0,
          )
        : [],
    ),
    agentsMdPreferences: normalizeAgentsMdPreferences(
      isObject(input.agentsMdPreferences)
        ? (input.agentsMdPreferences as Partial<AgentsMdPreferences>)
        : undefined,
    ),
    aiExtrasTarget: normalizeAiExtrasTarget(input.aiExtrasTarget),
    owner: input.owner,
    repositoryName: input.repositoryName,
    visibility: input.visibility,
    description: typeof input.description === 'string' ? input.description : undefined,
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProjectConfig(value: unknown): value is DownloadInitializrProjectInput['config'] {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.group === 'string' &&
    typeof value.artifact === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.packageName === 'string' &&
    typeof value.javaVersion === 'string' &&
    typeof value.springBootVersion === 'string' &&
    (value.buildTool === 'maven-project' || value.buildTool === 'gradle-project') &&
    (value.language === 'java' || value.language === 'kotlin') &&
    (value.packaging === 'jar' || value.packaging === 'war')
  )
}

function ensureRepositoryName(value: string) {
  if (
    value.length === 0 ||
    value.length > 100 ||
    !/^[A-Za-z0-9._-]+$/.test(value) ||
    value.startsWith('.') ||
    value.endsWith('.')
  ) {
    throw new Error('invalid repository name')
  }
}
