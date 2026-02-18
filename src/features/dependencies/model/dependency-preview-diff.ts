import type { ProjectPreviewResponse } from '@/server/features/initializr/functions/get-project-preview'

import {
  computePreviewDiff,
  type PreviewSnapshotDiff,
} from '@/features/preview/model/preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'

const POM_XML_PATH = 'pom.xml'

export function resolveDependencyPreviewDiff(
  baselinePreview: ProjectPreviewResponse | undefined,
  currentPreview: ProjectPreviewResponse | undefined,
): PreviewSnapshotDiff | null {
  if (!baselinePreview?.ok || !currentPreview?.ok) {
    return null
  }

  const rawDiff = computePreviewDiff(baselinePreview.snapshot.files, currentPreview.snapshot.files)

  return stripPomSpringBootVersionDiff(rawDiff, baselinePreview.snapshot.files, currentPreview.snapshot.files)
}

function stripPomSpringBootVersionDiff(
  diff: PreviewSnapshotDiff,
  baselineFiles: PreviewSnapshotFile[],
  currentFiles: PreviewSnapshotFile[],
): PreviewSnapshotDiff {
  const pomDiff = diff.files[POM_XML_PATH]

  if (!pomDiff || pomDiff.changeType !== 'modified' || pomDiff.binary || !pomDiff.lineDiff) {
    return diff
  }

  const baselinePom = baselineFiles.find((file) => file.path === POM_XML_PATH)
  const currentPom = currentFiles.find((file) => file.path === POM_XML_PATH)

  if (!baselinePom || !currentPom || baselinePom.binary || currentPom.binary) {
    return diff
  }

  const baselineSpringBootVersionLines = findSpringBootParentVersionLines(
    baselinePom.content ?? '',
  )
  const currentSpringBootVersionLines = findSpringBootParentVersionLines(
    currentPom.content ?? '',
  )

  const filteredRemoved = pomDiff.lineDiff.removed.filter(
    (line) => !baselineSpringBootVersionLines.has(line.lineNumber),
  )
  const filteredAdded = pomDiff.lineDiff.added.filter(
    (lineNumber) => !currentSpringBootVersionLines.has(lineNumber),
  )

  const hasChanged =
    filteredRemoved.length !== pomDiff.lineDiff.removed.length ||
    filteredAdded.length !== pomDiff.lineDiff.added.length

  if (!hasChanged) {
    return diff
  }

  const nextDiff: PreviewSnapshotDiff = {
    ...diff,
    files: { ...diff.files },
    added: [...diff.added],
    removed: [...diff.removed],
    modified: [...diff.modified],
    unchanged: [...diff.unchanged],
  }

  if (filteredRemoved.length === 0 && filteredAdded.length === 0) {
    nextDiff.files[POM_XML_PATH] = {
      ...pomDiff,
      changeType: 'unchanged',
      lineDiff: null,
    }
    nextDiff.modified = nextDiff.modified.filter((path) => path !== POM_XML_PATH)

    if (!nextDiff.unchanged.includes(POM_XML_PATH)) {
      nextDiff.unchanged.push(POM_XML_PATH)
      nextDiff.unchanged.sort((left, right) => left.localeCompare(right))
    }

    return nextDiff
  }

  nextDiff.files[POM_XML_PATH] = {
    ...pomDiff,
    lineDiff: {
      removed: filteredRemoved,
      added: filteredAdded,
    },
  }

  return nextDiff
}

function findSpringBootParentVersionLines(content: string): Set<number> {
  const lines = splitLines(content)
  const versionLines = new Set<number>()

  let lineIndex = 0
  while (lineIndex < lines.length) {
    if (!lines[lineIndex].includes('<parent>')) {
      lineIndex += 1
      continue
    }

    let parentEndIndex = lineIndex
    while (parentEndIndex < lines.length && !lines[parentEndIndex].includes('</parent>')) {
      parentEndIndex += 1
    }

    const parentLines = lines.slice(lineIndex, Math.min(parentEndIndex + 1, lines.length))
    const includesSpringBootParentCoordinates =
      parentLines.some((line) => line.includes('<groupId>org.springframework.boot</groupId>')) &&
      parentLines.some((line) =>
        line.includes('<artifactId>spring-boot-starter-parent</artifactId>'),
      )

    if (includesSpringBootParentCoordinates) {
      for (let index = lineIndex; index <= parentEndIndex && index < lines.length; index += 1) {
        if (/<version>\s*[^<]+\s*<\/version>/.test(lines[index])) {
          versionLines.add(index + 1)
        }
      }
    }

    lineIndex = Math.max(parentEndIndex + 1, lineIndex + 1)
  }

  return versionLines
}

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return []
  }

  return content.replace(/\r\n/g, '\n').split('\n')
}
