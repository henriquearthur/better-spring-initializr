import { describe, expect, it } from 'vitest'

import {
  fetchInitializrMetadata,
  InitializrClientError,
  normalizeInitializrMetadata,
} from './initializr-client'

describe('normalizeInitializrMetadata', () => {
  it('returns dependencies, java versions, and boot versions in stable shape', () => {
    const normalized = normalizeInitializrMetadata({
      dependencies: {
        values: [
          {
            name: 'Core',
            values: [
              {
                id: 'web',
                name: 'Spring Web',
                description: 'Build web applications',
                default: true,
              },
            ],
          },
        ],
      },
      javaVersion: {
        values: [
          { id: '17', name: '17' },
          { id: '21', name: '21', default: true },
        ],
      },
      bootVersion: {
        values: [
          { id: '3.3.4', name: '3.3.4' },
          { id: '3.4.0', name: '3.4.0', default: true },
        ],
      },
    })

    expect(normalized.dependencies).toEqual([
      {
        id: 'web',
        name: 'Spring Web',
        description: 'Build web applications',
        default: true,
        group: 'Core',
      },
    ])

    expect(normalized.javaVersions.map((option) => option.id)).toEqual(['17', '21'])
    expect(normalized.springBootVersions.map((option) => option.id)).toEqual([
      '3.3.4',
      '3.4.0',
    ])
  })
})

describe('fetchInitializrMetadata', () => {
  it('throws a typed upstream error when response is not ok', async () => {
    const failingFetch = async () =>
      new Response(JSON.stringify({ message: 'error' }), { status: 502 })

    await expect(
      fetchInitializrMetadata({ fetch: failingFetch as typeof fetch }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<InitializrClientError>>({
        code: 'UPSTREAM_ERROR',
        status: 502,
      }),
    )
  })
})
