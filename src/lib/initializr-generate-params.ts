import type { BuildTool, PackagingType, ProjectLanguage } from './project-config'

export type InitializrGenerationInput = {
  buildTool: BuildTool
  language: ProjectLanguage
  springBootVersion?: string | null
  group: string
  artifact: string
  name: string
  description?: string | null
  packageName?: string | null
  packaging: PackagingType
  javaVersion: string
  selectedDependencyIds: string[]
}

export type InitializrGenerateParamEntry = readonly [key: string, value: string]

export function buildInitializrGenerateParams(
  input: InitializrGenerationInput,
): InitializrGenerateParamEntry[] {
  const dependencies = normalizeDependencyIds(input.selectedDependencyIds)
  const normalizedBootVersion = normalizeSpringBootVersionForBuildTool(
    input.buildTool,
    input.springBootVersion,
  )
  const params: InitializrGenerateParamEntry[] = [
    ['type', input.buildTool],
    ['language', input.language],
  ]

  pushOptionalParam(params, 'bootVersion', normalizedBootVersion)

  params.push(
    ['baseDir', input.name.trim()],
    ['groupId', input.group.trim()],
    ['artifactId', input.artifact.trim()],
    ['name', input.name.trim()],
  )

  pushOptionalParam(params, 'description', input.description)
  pushOptionalParam(params, 'packageName', input.packageName)

  params.push(['packaging', input.packaging], ['javaVersion', input.javaVersion.trim()])

  if (dependencies.length > 0) {
    params.push(['dependencies', dependencies.join(',')])
  }

  return params
}

export function normalizeSpringBootVersionForBuildTool(
  buildTool: BuildTool,
  springBootVersion: string | null | undefined,
): string | undefined {
  const normalizedVersion = springBootVersion?.trim()

  if (!normalizedVersion) {
    return undefined
  }

  if (buildTool !== 'gradle-project') {
    return normalizedVersion
  }

  let gradleVersion = normalizedVersion

  if (gradleVersion.endsWith('.BUILD-SNAPSHOT')) {
    gradleVersion = `${gradleVersion.slice(0, -'.BUILD-SNAPSHOT'.length)}-SNAPSHOT`
  } else if (gradleVersion.endsWith('.RELEASE')) {
    gradleVersion = gradleVersion.slice(0, -'.RELEASE'.length)
  }

  gradleVersion = gradleVersion.replace(/\.M(\d+)$/, '-M$1')
  gradleVersion = gradleVersion.replace(/\.RC(\d+)$/, '-RC$1')

  return gradleVersion
}

function normalizeDependencyIds(selectedDependencyIds: string[]): string[] {
  return Array.from(
    new Set(selectedDependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)),
  )
}

function pushOptionalParam(
  params: InitializrGenerateParamEntry[],
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim()

  if (!normalized) {
    return
  }

  params.push([key, normalized])
}
