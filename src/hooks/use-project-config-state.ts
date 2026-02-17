import { useState } from 'react'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'

import {
  DEFAULT_PROJECT_CONFIG,
  normalizeProjectConfig,
  type ProjectConfig,
} from '@/lib/project-config'

const projectConfigQueryParsers = {
  group: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.group),
  artifact: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.artifact),
  name: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.name),
  description: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.description),
  packageName: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.packageName),
  javaVersion: parseAsString.withDefault(DEFAULT_PROJECT_CONFIG.javaVersion),
  springBootVersion: parseAsString.withDefault(
    DEFAULT_PROJECT_CONFIG.springBootVersion,
  ),
  buildTool: parseAsStringLiteral(['maven-project', 'gradle-project']).withDefault(
    DEFAULT_PROJECT_CONFIG.buildTool,
  ),
  language: parseAsStringLiteral(['java', 'kotlin']).withDefault(
    DEFAULT_PROJECT_CONFIG.language,
  ),
  packaging: parseAsStringLiteral(['jar', 'war']).withDefault(
    DEFAULT_PROJECT_CONFIG.packaging,
  ),
}

type ProjectConfigField = keyof ProjectConfig

export type ProjectConfigUpdateOptions = {
  persistToUrl?: boolean
}

export function useProjectConfigState() {
  const [queryConfig, setQueryConfig] = useQueryStates(projectConfigQueryParsers, {
    history: 'replace',
    shallow: false,
  })
  const [config, setConfigState] = useState<ProjectConfig>(() =>
    normalizeProjectConfig(queryConfig),
  )

  const setField = (
    field: ProjectConfigField,
    value: string,
    options?: ProjectConfigUpdateOptions,
  ) => {
    setConfigState((currentConfig) =>
      normalizeProjectConfig({
        ...currentConfig,
        [field]: value,
      }),
    )

    if (options?.persistToUrl === false) {
      return Promise.resolve(null)
    }

    return setQueryConfig({ [field]: value })
  }

  const setConfig = (
    nextConfig: ProjectConfig,
    options?: ProjectConfigUpdateOptions,
  ) => {
    const normalizedConfig = normalizeProjectConfig(nextConfig)
    setConfigState(normalizedConfig)

    if (options?.persistToUrl === false) {
      return Promise.resolve(null)
    }

    return setQueryConfig(normalizedConfig)
  }

  const resetConfig = (options?: ProjectConfigUpdateOptions) => {
    setConfigState(DEFAULT_PROJECT_CONFIG)

    if (options?.persistToUrl === false) {
      return Promise.resolve(null)
    }

    return setQueryConfig(DEFAULT_PROJECT_CONFIG)
  }

  return {
    config,
    setField,
    setConfig,
    resetConfig,
  }
}
