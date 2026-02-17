import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
