import type { BuiltinLanguage } from 'shiki'

export const SUPPORTED_CODE_PREVIEW_LANGUAGES: ReadonlySet<BuiltinLanguage> = new Set([
  'bash',
  'bat',
  'dockerfile',
  'dotenv',
  'groovy',
  'ini',
  'java',
  'json',
  'kotlin',
  'markdown',
  'properties',
  'toml',
  'xml',
  'yaml',
])

const SHELL_WRAPPER_NAMES = new Set(['mvnw', 'gradlew'])
const SHELL_WRAPPER_WINDOWS_NAMES = new Set(['mvnw.cmd', 'gradlew.bat'])

export function inferCodePreviewLanguage(path: string | undefined): BuiltinLanguage | null {
  if (!path) {
    return null
  }

  const normalizedPath = path.replace(/\\/g, '/').toLowerCase()
  const fileName = normalizedPath.split('/').pop() ?? normalizedPath

  if (fileName === '.gitignore') {
    return null
  }

  let inferredLanguage: BuiltinLanguage | null = null

  if (SHELL_WRAPPER_NAMES.has(fileName)) {
    inferredLanguage = 'bash'
  } else if (SHELL_WRAPPER_WINDOWS_NAMES.has(fileName)) {
    inferredLanguage = 'bat'
  } else if (fileName === '.env' || fileName.startsWith('.env.')) {
    inferredLanguage = 'dotenv'
  } else if (fileName === 'dockerfile') {
    inferredLanguage = 'dockerfile'
  } else if (normalizedPath.endsWith('.xml') || fileName === 'pom.xml') {
    inferredLanguage = 'xml'
  } else if (normalizedPath.endsWith('.gradle')) {
    inferredLanguage = 'groovy'
  } else if (normalizedPath.endsWith('.kts') || normalizedPath.endsWith('.kt')) {
    inferredLanguage = 'kotlin'
  } else if (normalizedPath.endsWith('.yaml') || normalizedPath.endsWith('.yml')) {
    inferredLanguage = 'yaml'
  } else if (normalizedPath.endsWith('.java')) {
    inferredLanguage = 'java'
  } else if (normalizedPath.endsWith('.md')) {
    inferredLanguage = 'markdown'
  } else if (normalizedPath.endsWith('.properties')) {
    inferredLanguage = 'properties'
  } else if (normalizedPath.endsWith('.json')) {
    inferredLanguage = 'json'
  } else if (normalizedPath.endsWith('.groovy')) {
    inferredLanguage = 'groovy'
  } else if (
    normalizedPath.endsWith('.sh') ||
    normalizedPath.endsWith('.bash') ||
    normalizedPath.endsWith('.zsh')
  ) {
    inferredLanguage = 'bash'
  } else if (normalizedPath.endsWith('.toml')) {
    inferredLanguage = 'toml'
  } else if (normalizedPath.endsWith('.conf') || normalizedPath.endsWith('.ini')) {
    inferredLanguage = 'ini'
  }

  if (!inferredLanguage) {
    return null
  }

  return SUPPORTED_CODE_PREVIEW_LANGUAGES.has(inferredLanguage) ? inferredLanguage : null
}

export function formatCodePreviewLanguageLabel(language: BuiltinLanguage | null): string {
  return language ?? 'plain text'
}
