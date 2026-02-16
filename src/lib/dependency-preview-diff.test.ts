import { describe, expect, it } from 'vitest'

import type { ProjectPreviewResponse } from '@/server/functions/get-project-preview'
import type { PreviewSnapshotFile } from './preview-tree'
import { resolveDependencyPreviewDiff } from './dependency-preview-diff'

function makeFile(partial: Partial<PreviewSnapshotFile> & { path: string }): PreviewSnapshotFile {
  return {
    path: partial.path,
    size: partial.size ?? 0,
    binary: partial.binary ?? false,
    hash: partial.hash ?? partial.path,
    content: partial.content,
  }
}

function makeSuccessPreview(
  files: PreviewSnapshotFile[],
  generatedAt = '2026-02-16T00:00:00.000Z',
): ProjectPreviewResponse {
  return {
    ok: true,
    snapshot: {
      generatedAt,
      files,
    },
  }
}

const previewUnavailable: ProjectPreviewResponse = {
  ok: false,
  error: {
    code: 'PREVIEW_UNAVAILABLE',
    message: 'Preview unavailable',
    retryable: true,
  },
}

describe('resolveDependencyPreviewDiff', () => {
  it('returns null when baseline preview is unavailable', () => {
    const current = makeSuccessPreview([makeFile({ path: 'pom.xml', hash: 'current', content: '<project />' })])

    expect(resolveDependencyPreviewDiff(undefined, current)).toBeNull()
    expect(resolveDependencyPreviewDiff(previewUnavailable, current)).toBeNull()
  })

  it('returns null when current preview is unavailable', () => {
    const baseline = makeSuccessPreview([makeFile({ path: 'pom.xml', hash: 'baseline', content: '<project />' })])

    expect(resolveDependencyPreviewDiff(baseline, undefined)).toBeNull()
    expect(resolveDependencyPreviewDiff(baseline, previewUnavailable)).toBeNull()
  })

  it('computes diff from default baseline to dependency-enabled current project', () => {
    const baseline = makeSuccessPreview([
      makeFile({
        path: 'pom.xml',
        hash: 'baseline',
        content: [
          '<project>',
          '  <dependencies>',
          '  </dependencies>',
          '</project>',
        ].join('\n'),
      }),
    ])
    const current = makeSuccessPreview(
      [
        makeFile({
          path: 'pom.xml',
          hash: 'with-web',
          content: [
            '<project>',
            '  <dependencies>',
            '    <dependency>spring-boot-starter-web</dependency>',
            '  </dependencies>',
            '</project>',
          ].join('\n'),
        }),
      ],
      '2026-02-16T00:00:01.000Z',
    )

    const diff = resolveDependencyPreviewDiff(baseline, current)

    expect(diff).not.toBeNull()
    expect(diff?.modified).toEqual(['pom.xml'])
    expect(diff?.removed).toEqual([])
    expect(diff?.files['pom.xml']?.lineDiff?.removed).toEqual([])
    expect(diff?.files['pom.xml']?.lineDiff?.added.length).toBeGreaterThan(0)
  })

  it('does not report removed code after adding then removing the same dependency', () => {
    const baselineFiles = [
      makeFile({
        path: 'pom.xml',
        hash: 'baseline',
        content: [
          '<project>',
          '  <dependencies>',
          '  </dependencies>',
          '</project>',
        ].join('\n'),
      }),
    ]
    const baseline = makeSuccessPreview(baselineFiles)
    const currentWithoutDependency = makeSuccessPreview(
      [
        makeFile({
          path: 'pom.xml',
          hash: 'baseline',
          content: [
            '<project>',
            '  <dependencies>',
            '  </dependencies>',
            '</project>',
          ].join('\n'),
        }),
      ],
      '2026-02-16T00:00:02.000Z',
    )

    const diff = resolveDependencyPreviewDiff(baseline, currentWithoutDependency)

    expect(diff).not.toBeNull()
    expect(diff?.added).toEqual([])
    expect(diff?.removed).toEqual([])
    expect(diff?.modified).toEqual([])
    expect(diff?.unchanged).toEqual(['pom.xml'])
  })

  it('ignores pom spring boot parent version-only changes', () => {
    const baseline = makeSuccessPreview([
      makeFile({
        path: 'pom.xml',
        hash: 'baseline',
        content: [
          '<project>',
          '  <parent>',
          '    <groupId>org.springframework.boot</groupId>',
          '    <artifactId>spring-boot-starter-parent</artifactId>',
          '    <version>3.5.10</version>',
          '    <relativePath/>',
          '  </parent>',
          '</project>',
        ].join('\n'),
      }),
    ])
    const currentWithOnlyVersionUpdate = makeSuccessPreview(
      [
        makeFile({
          path: 'pom.xml',
          hash: 'updated-version',
          content: [
            '<project>',
            '  <parent>',
            '    <groupId>org.springframework.boot</groupId>',
            '    <artifactId>spring-boot-starter-parent</artifactId>',
            '    <version>3.5.11</version>',
            '    <relativePath/>',
            '  </parent>',
            '</project>',
          ].join('\n'),
        }),
      ],
      '2026-02-16T00:00:02.500Z',
    )

    const diff = resolveDependencyPreviewDiff(baseline, currentWithOnlyVersionUpdate)

    expect(diff).not.toBeNull()
    expect(diff?.modified).toEqual([])
    expect(diff?.removed).toEqual([])
    expect(diff?.added).toEqual([])
    expect(diff?.unchanged).toEqual(['pom.xml'])
    expect(diff?.files['pom.xml']).toEqual({
      path: 'pom.xml',
      changeType: 'unchanged',
      binary: false,
      lineDiff: null,
    })
  })

  it('keeps non-version pom dependency changes while ignoring spring boot parent version changes', () => {
    const baseline = makeSuccessPreview([
      makeFile({
        path: 'pom.xml',
        hash: 'baseline',
        content: [
          '<project>',
          '  <parent>',
          '    <groupId>org.springframework.boot</groupId>',
          '    <artifactId>spring-boot-starter-parent</artifactId>',
          '    <version>3.5.10</version>',
          '    <relativePath/>',
          '  </parent>',
          '  <dependencies>',
          '  </dependencies>',
          '</project>',
        ].join('\n'),
      }),
    ])
    const currentWithDependencyAndVersionUpdate = makeSuccessPreview(
      [
        makeFile({
          path: 'pom.xml',
          hash: 'updated-version-and-dependency',
          content: [
            '<project>',
            '  <parent>',
            '    <groupId>org.springframework.boot</groupId>',
            '    <artifactId>spring-boot-starter-parent</artifactId>',
            '    <version>3.5.11</version>',
            '    <relativePath/>',
            '  </parent>',
            '  <dependencies>',
            '    <dependency>spring-boot-starter-web</dependency>',
            '  </dependencies>',
            '</project>',
          ].join('\n'),
        }),
      ],
      '2026-02-16T00:00:02.750Z',
    )

    const diff = resolveDependencyPreviewDiff(baseline, currentWithDependencyAndVersionUpdate)

    expect(diff).not.toBeNull()
    expect(diff?.modified).toEqual(['pom.xml'])
    expect(diff?.files['pom.xml']?.lineDiff).toEqual({
      added: [9],
      removed: [],
    })
  })

  it('compares alternate dependency selections to baseline instead of prior selection', () => {
    const baseline = makeSuccessPreview([
      makeFile({
        path: 'pom.xml',
        hash: 'baseline',
        content: [
          '<project>',
          '  <dependencies>',
          '  </dependencies>',
          '</project>',
        ].join('\n'),
      }),
    ])
    const currentWithActuatorOnly = makeSuccessPreview(
      [
        makeFile({
          path: 'pom.xml',
          hash: 'with-actuator',
          content: [
            '<project>',
            '  <dependencies>',
            '    <dependency>spring-boot-starter-actuator</dependency>',
            '  </dependencies>',
            '</project>',
          ].join('\n'),
        }),
      ],
      '2026-02-16T00:00:03.000Z',
    )

    const diff = resolveDependencyPreviewDiff(baseline, currentWithActuatorOnly)

    expect(diff).not.toBeNull()
    expect(diff?.modified).toEqual(['pom.xml'])
    expect(diff?.removed).toEqual([])
    expect(diff?.files['pom.xml']?.lineDiff?.removed).toEqual([])
  })
})
