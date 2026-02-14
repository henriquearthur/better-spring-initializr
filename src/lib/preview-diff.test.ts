import { describe, expect, it } from 'vitest'

import type { PreviewSnapshotFile } from './preview-tree'
import { computePreviewDiff } from './preview-diff'

function makeFile(partial: Partial<PreviewSnapshotFile> & { path: string }): PreviewSnapshotFile {
  return {
    path: partial.path,
    size: partial.size ?? 0,
    binary: partial.binary ?? false,
    hash: partial.hash ?? partial.path,
    content: partial.content,
  }
}

describe('computePreviewDiff', () => {
  it('marks unchanged files when hashes match', () => {
    const previous = [
      makeFile({ path: 'pom.xml', hash: 'same-hash', content: '<project/>', size: 10 }),
    ]
    const current = [
      makeFile({ path: 'pom.xml', hash: 'same-hash', content: '<project/>', size: 10 }),
    ]

    const diff = computePreviewDiff(previous, current)

    expect(diff.unchanged).toEqual(['pom.xml'])
    expect(diff.modified).toEqual([])
    expect(diff.files['pom.xml']).toEqual({
      path: 'pom.xml',
      changeType: 'unchanged',
      binary: false,
      lineDiff: null,
    })
  })

  it('marks added files and all new lines deterministically', () => {
    const current = [
      makeFile({
        path: 'src/main/resources/application.yml',
        hash: 'new-file',
        content: 'server:\n  port: 8080',
      }),
    ]

    const diff = computePreviewDiff([], current)

    expect(diff.added).toEqual(['src/main/resources/application.yml'])
    expect(diff.files['src/main/resources/application.yml']?.lineDiff).toEqual({
      added: [1, 2],
      removed: [],
    })
  })

  it('marks removed files and returns removed-line metadata', () => {
    const previous = [
      makeFile({
        path: 'README.md',
        hash: 'old-file',
        content: '# Demo\nOld content',
      }),
    ]

    const diff = computePreviewDiff(previous, [])

    expect(diff.removed).toEqual(['README.md'])
    expect(diff.files['README.md']?.lineDiff).toEqual({
      added: [],
      removed: [
        { lineNumber: 1, afterLine: 0, content: '# Demo' },
        { lineNumber: 2, afterLine: 0, content: 'Old content' },
      ],
    })
  })

  it('captures added and removed lines for modified text files', () => {
    const previous = [
      makeFile({
        path: 'build.gradle',
        hash: 'before',
        content: [
          'plugins {',
          "  id 'java'",
          '}',
          '',
          'dependencies {',
          "  implementation 'org.springframework.boot:spring-boot-starter-web'",
          '}',
        ].join('\n'),
      }),
    ]
    const current = [
      makeFile({
        path: 'build.gradle',
        hash: 'after',
        content: [
          'plugins {',
          "  id 'java'",
          "  id 'org.springframework.boot' version '3.5.6'",
          '}',
          '',
          'dependencies {',
          "  implementation 'org.springframework.boot:spring-boot-starter-web'",
          "  implementation 'org.springframework.boot:spring-boot-starter-actuator'",
          '}',
        ].join('\n'),
      }),
    ]

    const diff = computePreviewDiff(previous, current)
    const fileDiff = diff.files['build.gradle']

    expect(diff.modified).toEqual(['build.gradle'])
    expect(fileDiff?.changeType).toBe('modified')
    expect(fileDiff?.lineDiff).toEqual({
      added: [3, 8],
      removed: [],
    })
  })
})
