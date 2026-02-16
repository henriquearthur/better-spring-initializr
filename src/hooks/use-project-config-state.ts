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

export function useProjectConfigState() {
  const [queryConfig, setQueryConfig] = useQueryStates(projectConfigQueryParsers, {
    history: 'replace',
    shallow: false,
  })
  const config = normalizeProjectConfig(queryConfig)

  const setField = (field: ProjectConfigField, value: string) => {
    return setQueryConfig({ [field]: value })
  }

  const setConfig = (nextConfig: ProjectConfig) => {
    const normalizedConfig = normalizeProjectConfig(nextConfig)

    return setQueryConfig(normalizedConfig)
  }

  const resetConfig = () => {
    return setQueryConfig(DEFAULT_PROJECT_CONFIG)
  }

  return {
    config,
    setField,
    setConfig,
    resetConfig,
  }
}
