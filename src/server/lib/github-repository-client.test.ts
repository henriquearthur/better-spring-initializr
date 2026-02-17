import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createInitialCommit,
  createRepository,
  GitHubRepositoryClientError,
} from './github-repository-client'

describe('github repository client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates personal repository using /user/repos endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        owner: { login: 'octocat' },
        name: 'demo-service',
        full_name: 'octocat/demo-service',
        html_url: 'https://github.com/octocat/demo-service',
        default_branch: 'main',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await createRepository({
      accessToken: 'token',
      authenticatedUserLogin: 'octocat',
      owner: 'octocat',
      name: 'demo-service',
      visibility: 'private',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/user/repos',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"auto_init":true'),
      }),
    )
    expect(result).toEqual({
      owner: 'octocat',
      name: 'demo-service',
      fullName: 'octocat/demo-service',
      htmlUrl: 'https://github.com/octocat/demo-service',
      defaultBranch: 'main',
    })
  })

  it('creates organization repository using /orgs/{org}/repos endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        owner: { login: 'acme-inc' },
        name: 'platform-service',
        full_name: 'acme-inc/platform-service',
        html_url: 'https://github.com/acme-inc/platform-service',
        default_branch: 'main',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await createRepository({
      accessToken: 'token',
      authenticatedUserLogin: 'octocat',
      owner: 'acme-inc',
      name: 'platform-service',
      visibility: 'public',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/orgs/acme-inc/repos',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.fullName).toBe('acme-inc/platform-service')
  })

  it('maps 422 duplicate name to REPOSITORY_ALREADY_EXISTS', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          message: 'Repository creation failed',
          errors: [
            {
              resource: 'Repository',
              field: 'name',
              code: 'custom',
            },
          ],
        },
        { status: 422 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createRepository({
        accessToken: 'token',
        authenticatedUserLogin: 'octocat',
        owner: 'octocat',
        name: 'demo-service',
        visibility: 'private',
      }),
    ).rejects.toMatchObject({
      name: 'GitHubRepositoryClientError',
      code: 'REPOSITORY_ALREADY_EXISTS',
    })
  })

  it('creates initial commit and falls back to create refs/heads/main when update returns 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-b' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ ref: 'refs/heads/main' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInitialCommit({
      accessToken: 'token',
      owner: 'octocat',
      repository: 'demo-service',
      message: 'Initial commit from Better Spring Initializr',
      files: [
        { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
        { path: 'README.md', base64Content: 'IyBEZW1v' },
      ],
    })

    expect(result).toEqual({ commitSha: 'commit-sha' })
    expect(fetchMock).toHaveBeenCalledTimes(7)
    expect(fetchMock.mock.calls[6][0]).toBe('https://api.github.com/repos/octocat/demo-service/git/refs')
  })

  it('creates initial commit and falls back to create refs/heads/main when update returns 422', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-b' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Reference does not exist' }, { status: 422 }))
      .mockResolvedValueOnce(jsonResponse({ ref: 'refs/heads/main' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInitialCommit({
      accessToken: 'token',
      owner: 'octocat',
      repository: 'demo-service',
      message: 'Initial commit from Better Spring Initializr',
      files: [
        { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
        { path: 'README.md', base64Content: 'IyBEZW1v' },
      ],
    })

    expect(result).toEqual({ commitSha: 'commit-sha' })
    expect(fetchMock).toHaveBeenCalledTimes(7)
    expect(fetchMock.mock.calls[6][0]).toBe('https://api.github.com/repos/octocat/demo-service/git/refs')
  })

  it('creates initial commit using provided default branch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-b' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ ref: 'refs/heads/master' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInitialCommit({
      accessToken: 'token',
      owner: 'octocat',
      repository: 'demo-service',
      branch: 'master',
      message: 'Initial commit from Better Spring Initializr',
      files: [
        { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
        { path: 'README.md', base64Content: 'IyBEZW1v' },
      ],
    })

    expect(result).toEqual({ commitSha: 'commit-sha' })
    expect(fetchMock.mock.calls[5][0]).toBe(
      'https://api.github.com/repos/octocat/demo-service/git/refs/heads/master',
    )
    expect(fetchMock.mock.calls[6][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          ref: 'refs/heads/master',
          sha: 'commit-sha',
        }),
      }),
    )
  })

  it('retries update ref when create ref returns 422', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-b' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Reference does not exist' }, { status: 422 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Reference already exists' }, { status: 422 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInitialCommit({
      accessToken: 'token',
      owner: 'octocat',
      repository: 'demo-service',
      message: 'Initial commit from Better Spring Initializr',
      files: [
        { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
        { path: 'README.md', base64Content: 'IyBEZW1v' },
      ],
    })

    expect(result).toEqual({ commitSha: 'commit-sha' })
    expect(fetchMock).toHaveBeenCalledTimes(8)
    expect(fetchMock.mock.calls[7][0]).toBe(
      'https://api.github.com/repos/octocat/demo-service/git/refs/heads/main',
    )
  })

  it('creates commit with parent when branch reference already exists', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'parent-sha' } }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-b' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInitialCommit({
      accessToken: 'token',
      owner: 'octocat',
      repository: 'demo-service',
      message: 'Initial commit',
      files: [
        { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
        { path: 'README.md', base64Content: 'IyBEZW1v' },
      ],
    })

    expect(result).toEqual({ commitSha: 'commit-sha' })
    expect(fetchMock.mock.calls[4][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"parents":["parent-sha"]'),
      }),
    )
  })

  it('maps git pipeline failure to COMMIT_FAILED', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'blob-a' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'upstream failed' }, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createInitialCommit({
        accessToken: 'token',
        owner: 'octocat',
        repository: 'demo-service',
        message: 'Initial commit',
        files: [
          { path: 'pom.xml', base64Content: 'PHByb2plY3Q+PC9wcm9qZWN0Pg==' },
          { path: 'README.md', base64Content: 'IyBEZW1v' },
        ],
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof GitHubRepositoryClientError && error.code === 'COMMIT_FAILED',
    )
  })
})

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}
