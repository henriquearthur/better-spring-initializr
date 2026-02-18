import type { InitializrMetadataResponseLike } from './initializr-metadata'

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

export const PROJECT_CONFIG_STORAGE_KEY = 'better-spring-initializr:config:v1'

export const PROJECT_CONFIG_QUERY_KEYS = [
  'group',
  'artifact',
  'name',
  'description',
  'packageName',
  'javaVersion',
  'springBootVersion',
  'buildTool',
  'language',
  'packaging',
] as const

const FALLBACK_JAVA_VERSION = '21'
const FALLBACK_SPRING_BOOT_VERSION = '3.5.10'

const BUILD_TOOLS: readonly BuildTool[] = ['maven-project', 'gradle-project']
const PROJECT_LANGUAGES: readonly ProjectLanguage[] = ['java', 'kotlin']
const PACKAGING_TYPES: readonly PackagingType[] = ['jar', 'war']

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
  metadataResponse: InitializrMetadataResponseLike | null | undefined,
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
  metadataResponse: InitializrMetadataResponseLike | null | undefined,
): ProjectConfig {
  const metadataOptions = getMetadataDrivenConfigOptions(metadataResponse)

  return {
    ...DEFAULT_PROJECT_CONFIG,
    javaVersion: metadataOptions.defaults.javaVersion,
    springBootVersion: metadataOptions.defaults.springBootVersion,
  }
}

export function normalizeProjectConfig(
  config: Partial<ProjectConfig> | null | undefined,
): ProjectConfig {
  return {
    group: normalizeTextValue(config?.group, DEFAULT_PROJECT_CONFIG.group),
    artifact: normalizeTextValue(config?.artifact, DEFAULT_PROJECT_CONFIG.artifact),
    name: normalizeTextValue(config?.name, DEFAULT_PROJECT_CONFIG.name),
    description: normalizeTextValue(
      config?.description,
      DEFAULT_PROJECT_CONFIG.description,
    ),
    packageName: normalizeTextValue(
      config?.packageName,
      DEFAULT_PROJECT_CONFIG.packageName,
    ),
    javaVersion: normalizeTextValue(
      config?.javaVersion,
      DEFAULT_PROJECT_CONFIG.javaVersion,
    ),
    springBootVersion: normalizeTextValue(
      config?.springBootVersion,
      DEFAULT_PROJECT_CONFIG.springBootVersion,
    ),
    buildTool: normalizeStringUnion(
      config?.buildTool,
      BUILD_TOOLS,
      DEFAULT_PROJECT_CONFIG.buildTool,
    ),
    language: normalizeStringUnion(
      config?.language,
      PROJECT_LANGUAGES,
      DEFAULT_PROJECT_CONFIG.language,
    ),
    packaging: normalizeStringUnion(
      config?.packaging,
      PACKAGING_TYPES,
      DEFAULT_PROJECT_CONFIG.packaging,
    ),
  }
}

export function hasProjectConfigQueryParams(search: string): boolean {
  const searchParams = new URLSearchParams(search)

  return PROJECT_CONFIG_QUERY_KEYS.some((key) => searchParams.has(key))
}

export function readProjectConfigFromStorage(
  storage: Pick<Storage, 'getItem'>,
): ProjectConfig | null {
  const rawValue = storage.getItem(PROJECT_CONFIG_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ProjectConfig>

    return normalizeProjectConfig(parsed)
  } catch {
    return null
  }
}

export function writeProjectConfigToStorage(
  storage: Pick<Storage, 'setItem'>,
  config: ProjectConfig,
) {
  storage.setItem(PROJECT_CONFIG_STORAGE_KEY, JSON.stringify(config))
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

function normalizeTextValue(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  return value
}

function normalizeStringUnion<TValue extends string>(
  value: string | undefined,
  allowedValues: readonly TValue[],
  fallback: TValue,
): TValue {
  if (!value) {
    return fallback
  }

  if (!allowedValues.includes(value as TValue)) {
    return fallback
  }

  return value as TValue
}

export type {
  InitializrDependency,
  InitializrMetadata,
  InitializrMetadataResponseLike,
  InitializrOption,
} from './initializr-metadata'
