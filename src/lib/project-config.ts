import type { InitializrMetadataResponse } from '@/server/functions/get-initializr-metadata'

export type ProjectConfig = {
  group: string
  artifact: string
  name: string
  description: string
  packageName: string
  javaVersion: string
  springBootVersion: string
  buildTool: BuildTool
  language: ProjectLanguage
  packaging: PackagingType
}

export type BuildTool = 'maven-project' | 'gradle-project'
export type ProjectLanguage = 'java' | 'kotlin'
export type PackagingType = 'jar' | 'war'

export type ConfigOption<TValue extends string = string> = {
  value: TValue
  label: string
}

const FALLBACK_JAVA_VERSION = '21'
const FALLBACK_SPRING_BOOT_VERSION = '3.4.0'

export const BUILD_TOOL_OPTIONS: ConfigOption<BuildTool>[] = [
  { value: 'maven-project', label: 'Maven' },
  { value: 'gradle-project', label: 'Gradle' },
]

export const LANGUAGE_OPTIONS: ConfigOption<ProjectLanguage>[] = [
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
]

export const PACKAGING_OPTIONS: ConfigOption<PackagingType>[] = [
  { value: 'jar', label: 'JAR' },
  { value: 'war', label: 'WAR' },
]

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  group: 'com.example',
  artifact: 'demo',
  name: 'demo',
  description: 'Demo project for Spring Boot',
  packageName: 'com.example.demo',
  javaVersion: FALLBACK_JAVA_VERSION,
  springBootVersion: FALLBACK_SPRING_BOOT_VERSION,
  buildTool: 'maven-project',
  language: 'java',
  packaging: 'jar',
}

type MetadataOption = {
  id: string
  name: string
  default: boolean
}

export type MetadataDrivenConfigOptions = {
  javaVersions: ConfigOption[]
  springBootVersions: ConfigOption[]
  defaults: Pick<ProjectConfig, 'javaVersion' | 'springBootVersion'>
}

export function getMetadataDrivenConfigOptions(
  metadataResponse: InitializrMetadataResponse | null | undefined,
): MetadataDrivenConfigOptions {
  const metadata = metadataResponse?.ok ? metadataResponse.metadata : null
  const javaVersions = mapMetadataOptions(metadata?.javaVersions)
  const springBootVersions = mapMetadataOptions(metadata?.springBootVersions)

  return {
    javaVersions: toConfigOptions(javaVersions),
    springBootVersions: toConfigOptions(springBootVersions),
    defaults: {
      javaVersion: pickDefaultOptionId(javaVersions, FALLBACK_JAVA_VERSION),
      springBootVersion: pickDefaultOptionId(
        springBootVersions,
        FALLBACK_SPRING_BOOT_VERSION,
      ),
    },
  }
}

export function getProjectConfigWithMetadataDefaults(
  metadataResponse: InitializrMetadataResponse | null | undefined,
): ProjectConfig {
  const metadataOptions = getMetadataDrivenConfigOptions(metadataResponse)

  return {
    ...DEFAULT_PROJECT_CONFIG,
    javaVersion: metadataOptions.defaults.javaVersion,
    springBootVersion: metadataOptions.defaults.springBootVersion,
  }
}

type MappedMetadataOption = ConfigOption & {
  default: boolean
}

function mapMetadataOptions(
  options: MetadataOption[] | undefined,
): MappedMetadataOption[] {
  if (!options || options.length === 0) {
    return []
  }

  return options.map((option) => ({
    value: option.id,
    label: option.name,
    default: option.default,
  }))
}

function toConfigOptions(options: MappedMetadataOption[]): ConfigOption[] {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
  }))
}

function pickDefaultOptionId(
  options: MappedMetadataOption[],
  fallback: string,
): string {
  if (options.length === 0) {
    return fallback
  }

  const metadataDefault = options.find((option) => option.default)

  if (metadataDefault) {
    return metadataDefault.value
  }

  const exactFallback = options.find((option) => option.value === fallback)

  if (exactFallback) {
    return exactFallback.value
  }

  return options[0].value
}
