import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_PROJECT_CONFIG, type ProjectConfig } from '@/shared/lib/project-config'

const { setQueryConfigMock, useQueryStatesMock, useStateMock } = vi.hoisted(() => ({
  setQueryConfigMock: vi.fn(() => Promise.resolve(new URLSearchParams())),
  useQueryStatesMock: vi.fn(),
  useStateMock: vi.fn(),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    useState: useStateMock,
  }
})

vi.mock('nuqs', () => ({
  parseAsString: {
    withDefault: vi.fn(() => ({ kind: 'string-parser' })),
  },
  parseAsStringLiteral: vi.fn(() => ({
    withDefault: vi.fn(() => ({ kind: 'string-literal-parser' })),
  })),
  useQueryStates: useQueryStatesMock,
}))

import { useProjectConfigState } from './use-project-config-state'

describe('useProjectConfigState', () => {
  beforeEach(() => {
    setQueryConfigMock.mockReset()
    setQueryConfigMock.mockResolvedValue(new URLSearchParams())
    useQueryStatesMock.mockReset()
    useQueryStatesMock.mockReturnValue([DEFAULT_PROJECT_CONFIG, setQueryConfigMock])
    useStateMock.mockReset()
  })

  it('keeps local config updates when URL persistence is disabled', async () => {
    let localConfig = DEFAULT_PROJECT_CONFIG
    const setConfigStateMock = vi.fn(
      (
        nextState:
          | ProjectConfig
          | ((currentConfig: ProjectConfig) => ProjectConfig),
      ) => {
        localConfig =
          typeof nextState === 'function' ? nextState(localConfig) : nextState
      },
    )

    useStateMock.mockImplementation(
      (initialState: ProjectConfig | (() => ProjectConfig)) => {
        localConfig =
          typeof initialState === 'function' ? initialState() : initialState

        return [localConfig, setConfigStateMock]
      },
    )

    const state = useProjectConfigState()

    await state.setConfig(
      {
        ...DEFAULT_PROJECT_CONFIG,
        group: 'dev.acme',
      },
      { persistToUrl: false },
    )

    expect(localConfig.group).toBe('dev.acme')
    expect(setQueryConfigMock).not.toHaveBeenCalled()
  })

  it('persists field updates to URL by default', async () => {
    let localConfig = DEFAULT_PROJECT_CONFIG
    const setConfigStateMock = vi.fn(
      (
        nextState:
          | ProjectConfig
          | ((currentConfig: ProjectConfig) => ProjectConfig),
      ) => {
        localConfig =
          typeof nextState === 'function' ? nextState(localConfig) : nextState
      },
    )

    useStateMock.mockImplementation(
      (initialState: ProjectConfig | (() => ProjectConfig)) => {
        localConfig =
          typeof initialState === 'function' ? initialState() : initialState

        return [localConfig, setConfigStateMock]
      },
    )

    const state = useProjectConfigState()

    await state.setField('group', 'dev.acme')

    expect(localConfig.group).toBe('dev.acme')
    expect(setQueryConfigMock).toHaveBeenCalledWith({ group: 'dev.acme' })
  })
})
