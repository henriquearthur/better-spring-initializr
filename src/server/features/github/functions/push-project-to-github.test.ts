import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_AGENTS_MD_PREFERENCES } from '@/features/ai-extras/model/ai-extras'

import * as githubRepositoryClient from '../infra/github-repository-client'
import * as oauthSession from '../infra/github-oauth-session.server'
import * as unpackProject from '../infra/unpack-generated-project'
import * as downloadProject from '@/server/features/initializr/functions/download-initializr-project'
import { pushProjectToGitHubFromBff } from './push-project-to-github'

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

const sessionFixture = {
  connectedAt: '2026-02-14T00:00:00.000Z',
  token: {
    accessToken: 'secret-token',
    tokenType: 'bearer',
    scope: 'repo read:org',
  },
  user: {
    id: 1,
    login: 'octocat',
    name: 'Octo Cat',
    avatarUrl: null,
  },
  organizations: [
    {
      id: 2,
      login: 'acme-inc',
      role: 'admin',
    },
  ],
}

describe('pushProjectToGitHubFromBff', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns auth-required error when oauth session is missing', async () => {
    vi.spyOn(oauthSession, 'getGitHubSessionCookie').mockResolvedValue(null)

    const response = await pushProjectToGitHubFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      owner: 'octocat',
      repositoryName: 'demo-repo',
      visibility: 'private',
    })

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'GITHUB_AUTH_REQUIRED',
        message: 'Connect GitHub before creating and pushing a repository.',
        retryable: false,
      },
    })
  })

  it('maps invalid repository names before making upstream calls', async () => {
    vi.spyOn(oauthSession, 'getGitHubSessionCookie').mockResolvedValue(sessionFixture)

    const response = await pushProjectToGitHubFromBff({
      config: configFixture,
      selectedDependencyIds: ['web'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      owner: 'octocat',
      repositoryName: 'bad repo name',
      visibility: 'private',
    })

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'INVALID_REPOSITORY_NAME',
        message:
          'Repository name can include letters, numbers, dots, dashes, or underscores.',
        retryable: false,
      },
    })
  })

  it('creates repository, pushes initial commit, and returns repository URL', async () => {
    vi.spyOn(oauthSession, 'getGitHubSessionCookie').mockResolvedValue(sessionFixture)
    const downloadSpy = vi
      .spyOn(downloadProject, 'downloadInitializrProjectFromBff')
      .mockResolvedValue({
        ok: true,
        archive: {
          base64: 'UEsDBA==',
          contentType: 'application/zip',
          filename: 'demo.zip',
        },
      })
    vi.spyOn(unpackProject, 'unpackGeneratedProjectZip').mockResolvedValue([
      {
        path: 'README.md',
        base64Content: 'IyBkZW1v',
        size: 6,
        binary: false,
      },
    ])
    vi.spyOn(githubRepositoryClient, 'createRepository').mockResolvedValue({
      owner: 'acme-inc',
      name: 'demo-service',
      fullName: 'acme-inc/demo-service',
      htmlUrl: 'https://github.com/acme-inc/demo-service',
      defaultBranch: 'main',
    })
    const createInitialCommitSpy = vi
      .spyOn(githubRepositoryClient, 'createInitialCommit')
      .mockResolvedValue({ commitSha: 'abc123' })

    const response = await pushProjectToGitHubFromBff({
      config: configFixture,
      selectedDependencyIds: ['web', 'data-jpa'],
      selectedAiExtraIds: ['agents-md', 'skill-security-audit'],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: true,
        includeTaskScopeDisciplineGuidance: false,
      },
      aiExtrasTarget: 'both',
      owner: 'acme-inc',
      repositoryName: 'demo-service',
      visibility: 'public',
    })

    expect(downloadSpy).toHaveBeenCalledWith({
      config: configFixture,
      selectedDependencyIds: ['web', 'data-jpa'],
      selectedAiExtraIds: ['agents-md', 'skill-security-audit'],
      agentsMdPreferences: {
        includeFeatureBranchesGuidance: true,
        includeConventionalCommitsGuidance: false,
        includePullRequestsGuidance: true,
        includeRunRelevantTestsGuidance: true,
        includeTaskScopeDisciplineGuidance: false,
      },
      aiExtrasTarget: 'both',
      generationSource: 'github-push',
    })
    expect(createInitialCommitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'acme-inc',
        repository: 'demo-service',
        branch: 'main',
      }),
    )
    expect(response).toEqual({
      ok: true,
      repositoryUrl: 'https://github.com/acme-inc/demo-service',
      fullName: 'acme-inc/demo-service',
    })
  })

  it('returns actionable error when GitHub rejects initial branch update', async () => {
    vi.spyOn(oauthSession, 'getGitHubSessionCookie').mockResolvedValue(sessionFixture)
    vi.spyOn(downloadProject, 'downloadInitializrProjectFromBff').mockResolvedValue({
      ok: true,
      archive: {
        base64: 'UEsDBA==',
        contentType: 'application/zip',
        filename: 'demo.zip',
      },
    })
    vi.spyOn(unpackProject, 'unpackGeneratedProjectZip').mockResolvedValue([
      {
        path: 'README.md',
        base64Content: 'IyBkZW1v',
        size: 6,
        binary: false,
      },
    ])
    vi.spyOn(githubRepositoryClient, 'createRepository').mockResolvedValue({
      owner: 'acme-inc',
      name: 'demo-service',
      fullName: 'acme-inc/demo-service',
      htmlUrl: 'https://github.com/acme-inc/demo-service',
      defaultBranch: 'main',
    })
    vi.spyOn(githubRepositoryClient, 'createInitialCommit').mockRejectedValue(
      new githubRepositoryClient.GitHubRepositoryClientError(
        'Unable to update repository main branch reference in GitHub.',
        'COMMIT_FAILED',
        422,
      ),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await pushProjectToGitHubFromBff({
      config: configFixture,
      selectedDependencyIds: ['web', 'data-jpa'],
      selectedAiExtraIds: [],
      agentsMdPreferences: DEFAULT_AGENTS_MD_PREFERENCES,
      aiExtrasTarget: 'agents',
      owner: 'acme-inc',
      repositoryName: 'demo-service',
      visibility: 'public',
    })

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'GITHUB_REPOSITORY_PUSH_FAILED',
        message:
          'Repository was created, but GitHub rejected the initial branch update. Check branch rulesets/protection and retry.',
        retryable: false,
      },
    })
  })
})
