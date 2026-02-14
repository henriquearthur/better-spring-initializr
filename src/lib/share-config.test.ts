import { describe, expect, it } from 'vitest'

import { DEFAULT_PROJECT_CONFIG } from './project-config'
import { decodeShareConfig, encodeShareConfig } from './share-config'

describe('share config codec', () => {
  it('encodes and decodes a configuration snapshot deterministically', () => {
    const token = encodeShareConfig({
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
        artifact: 'petstore',
      },
      selectedDependencyIds: ['web', 'actuator', 'web', '  data-jpa  '],
    })

    const decoded = decodeShareConfig(token)

    expect(decoded).toEqual({
      config: {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
        artifact: 'petstore',
      },
      selectedDependencyIds: ['actuator', 'data-jpa', 'web'],
    })
  })

  it('returns null for malformed tokens', () => {
    expect(decodeShareConfig('@@not-valid-base64url@@')).toBeNull()
  })

  it('returns null for unsupported schema versions', () => {
    const unsupported = btoa(
      JSON.stringify({
        v: 999,
        config: DEFAULT_PROJECT_CONFIG,
        selectedDependencyIds: ['web'],
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '')

    expect(decodeShareConfig(unsupported)).toBeNull()
  })
})
