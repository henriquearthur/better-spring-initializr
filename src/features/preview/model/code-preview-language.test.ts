import { describe, expect, it } from 'vitest'

import { inferCodePreviewLanguage } from './code-preview-language'

describe('inferCodePreviewLanguage', () => {
  it('infers Java and Kotlin sources deterministically', () => {
    expect(inferCodePreviewLanguage('src/main/java/com/example/DemoApplication.java')).toBe('java')
    expect(inferCodePreviewLanguage('build.gradle.kts')).toBe('kotlin')
    expect(inferCodePreviewLanguage('src/main/kotlin/com/example/Demo.kt')).toBe('kotlin')
  })

  it('maps Gradle and shell wrappers to supported languages', () => {
    expect(inferCodePreviewLanguage('build.gradle')).toBe('groovy')
    expect(inferCodePreviewLanguage('gradlew')).toBe('bash')
    expect(inferCodePreviewLanguage('gradlew.bat')).toBe('bat')
  })

  it('keeps yaml/json/xml/properties inference deterministic', () => {
    expect(inferCodePreviewLanguage('src/main/resources/application.yml')).toBe('yaml')
    expect(inferCodePreviewLanguage('src/main/resources/application.yaml')).toBe('yaml')
    expect(inferCodePreviewLanguage('package.json')).toBe('json')
    expect(inferCodePreviewLanguage('pom.xml')).toBe('xml')
    expect(inferCodePreviewLanguage('gradle.properties')).toBe('properties')
  })

  it('returns plain text fallback for .gitignore and unknown extensions', () => {
    expect(inferCodePreviewLanguage('.gitignore')).toBeNull()
    expect(inferCodePreviewLanguage('notes/README.unknownext')).toBeNull()
  })
})
