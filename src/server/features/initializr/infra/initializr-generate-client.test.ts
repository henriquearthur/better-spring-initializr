import { describe, expect, it } from 'vitest'

import {
  fetchInitializrZip,
  InitializrGenerateClientError,
} from './initializr-generate-client'

describe('fetchInitializrZip', () => {
  it('returns bytes and response metadata for a valid archive response', async () => {
    const payload = new Uint8Array([80, 75, 3, 4])
    const fetchMock = async (input: URL | RequestInfo) => {
      const requestedUrl = input instanceof URL ? input : new URL(String(input))

      expect(requestedUrl.searchParams.get('type')).toBe('maven-project')
      expect(requestedUrl.searchParams.get('dependencies')).toBe('web,data-jpa')

      return new Response(payload, {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream; charset=binary',
          'content-disposition': 'attachment; filename="demo-service.zip"',
        },
      })
    }

    const result = await fetchInitializrZip({
      params: [
        ['type', 'maven-project'],
        ['dependencies', 'web,data-jpa'],
      ],
      fetch: fetchMock as typeof fetch,
    })

    expect(Array.from(result.bytes)).toEqual(Array.from(payload))
    expect(result.contentType).toBe('application/octet-stream')
    expect(result.suggestedFilename).toBe('demo-service.zip')
  })

  it('throws typed upstream error when response is non-OK', async () => {
    const failingFetch = async () => new Response('nope', { status: 502 })

    await expect(
      fetchInitializrZip({
        params: [['type', 'maven-project']],
        fetch: failingFetch as typeof fetch,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InitializrGenerateClientError>>({
        code: 'UPSTREAM_ERROR',
        status: 502,
      }),
    )
  })

  it('throws typed upstream error on connection failure', async () => {
    const failingFetch = async () => {
      throw new Error('network down')
    }

    await expect(
      fetchInitializrZip({
        params: [['type', 'maven-project']],
        fetch: failingFetch as typeof fetch,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InitializrGenerateClientError>>({
        code: 'UPSTREAM_ERROR',
      }),
    )
  })

  it('throws typed invalid response error when payload is empty', async () => {
    const fetchMock = async () =>
      new Response(new Uint8Array(), {
        status: 200,
      })

    await expect(
      fetchInitializrZip({
        params: [['type', 'maven-project']],
        fetch: fetchMock as typeof fetch,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InitializrGenerateClientError>>({
        code: 'INVALID_RESPONSE',
        status: 200,
      }),
    )
  })
})
