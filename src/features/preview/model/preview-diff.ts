import type { PreviewSnapshotFile } from './preview-tree'

export type PreviewFileChangeType = 'added' | 'removed' | 'modified' | 'unchanged'

export type PreviewRemovedLine = {
  lineNumber: number
  afterLine: number
  content: string
}

export type PreviewLineDiff = {
  added: number[]
  removed: PreviewRemovedLine[]
}

export type PreviewFileDiff = {
  path: string
  changeType: PreviewFileChangeType
  binary: boolean
  lineDiff: PreviewLineDiff | null
}

export type PreviewSnapshotDiff = {
  files: Record<string, PreviewFileDiff>
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
}

export function computePreviewDiff(
  previousFiles: PreviewSnapshotFile[] | undefined,
  currentFiles: PreviewSnapshotFile[] | undefined,
): PreviewSnapshotDiff {
  const previousMap = toFileMap(previousFiles)
  const currentMap = toFileMap(currentFiles)
  const allPaths = Array.from(new Set([...previousMap.keys(), ...currentMap.keys()])).sort((a, b) =>
    a.localeCompare(b),
  )

  const result: PreviewSnapshotDiff = {
    files: {},
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  }

  for (const path of allPaths) {
    const previousFile = previousMap.get(path)
    const currentFile = currentMap.get(path)

    if (!previousFile && currentFile) {
      result.files[path] = {
        path,
        changeType: 'added',
        binary: currentFile.binary,
        lineDiff: currentFile.binary ? null : buildAddedLineDiff(currentFile.content),
      }
      result.added.push(path)
      continue
    }

    if (previousFile && !currentFile) {
      result.files[path] = {
        path,
        changeType: 'removed',
        binary: previousFile.binary,
        lineDiff: previousFile.binary ? null : buildRemovedLineDiff(previousFile.content),
      }
      result.removed.push(path)
      continue
    }

    if (!previousFile || !currentFile) {
      continue
    }

    if (previousFile.hash === currentFile.hash) {
      result.files[path] = {
        path,
        changeType: 'unchanged',
        binary: currentFile.binary,
        lineDiff: null,
      }
      result.unchanged.push(path)
      continue
    }

    if (previousFile.binary || currentFile.binary) {
      result.files[path] = {
        path,
        changeType: 'modified',
        binary: previousFile.binary || currentFile.binary,
        lineDiff: null,
      }
      result.modified.push(path)
      continue
    }

    const lineDiff = computeLineDiff(previousFile.content ?? '', currentFile.content ?? '')
    const hasLineChanges = lineDiff.added.length > 0 || lineDiff.removed.length > 0

    if (!hasLineChanges) {
      result.files[path] = {
        path,
        changeType: 'unchanged',
        binary: false,
        lineDiff: null,
      }
      result.unchanged.push(path)
      continue
    }

    result.files[path] = {
      path,
      changeType: 'modified',
      binary: false,
      lineDiff,
    }
    result.modified.push(path)
  }

  return result
}

function toFileMap(files: PreviewSnapshotFile[] | undefined): Map<string, PreviewSnapshotFile> {
  const map = new Map<string, PreviewSnapshotFile>()

  for (const file of files ?? []) {
    map.set(file.path, file)
  }

  return map
}

function buildAddedLineDiff(content: string | undefined): PreviewLineDiff {
  const lines = splitLines(content ?? '')

  return {
    added: lines.map((_, index) => index + 1),
    removed: [],
  }
}

function buildRemovedLineDiff(content: string | undefined): PreviewLineDiff {
  const lines = splitLines(content ?? '')

  return {
    added: [],
    removed: lines.map((line, index) => ({
      lineNumber: index + 1,
      afterLine: 0,
      content: line,
    })),
  }
}

function computeLineDiff(previousContent: string, currentContent: string): PreviewLineDiff {
  const previousLines = splitLines(previousContent)
  const currentLines = splitLines(currentContent)
  const lcs = buildLcsMatrix(previousLines, currentLines)
  const operations = walkLineOperations(previousLines, currentLines, lcs)

  const added: number[] = []
  const removed: PreviewRemovedLine[] = []
  let previousLineNumber = 1
  let currentLineNumber = 1

  for (const operation of operations) {
    if (operation.type === 'equal') {
      previousLineNumber += 1
      currentLineNumber += 1
      continue
    }

    if (operation.type === 'add') {
      added.push(currentLineNumber)
      currentLineNumber += 1
      continue
    }

    removed.push({
      lineNumber: previousLineNumber,
      afterLine: Math.max(0, currentLineNumber - 1),
      content: operation.content,
    })
    previousLineNumber += 1
  }

  return {
    added,
    removed,
  }
}

type LineOperation =
  | { type: 'equal'; content: string }
  | { type: 'add'; content: string }
  | { type: 'remove'; content: string }

function buildLcsMatrix(previousLines: string[], currentLines: string[]): number[][] {
  const matrix = Array.from({ length: previousLines.length + 1 }, () =>
    Array.from({ length: currentLines.length + 1 }, () => 0),
  )

  for (let previousIndex = 1; previousIndex <= previousLines.length; previousIndex += 1) {
    for (let currentIndex = 1; currentIndex <= currentLines.length; currentIndex += 1) {
      if (previousLines[previousIndex - 1] === currentLines[currentIndex - 1]) {
        matrix[previousIndex][currentIndex] = matrix[previousIndex - 1][currentIndex - 1] + 1
      } else {
        matrix[previousIndex][currentIndex] = Math.max(
          matrix[previousIndex - 1][currentIndex],
          matrix[previousIndex][currentIndex - 1],
        )
      }
    }
  }

  return matrix
}

function walkLineOperations(
  previousLines: string[],
  currentLines: string[],
  matrix: number[][],
): LineOperation[] {
  const operations: LineOperation[] = []
  let previousIndex = previousLines.length
  let currentIndex = currentLines.length

  while (previousIndex > 0 || currentIndex > 0) {
    if (
      previousIndex > 0 &&
      currentIndex > 0 &&
      previousLines[previousIndex - 1] === currentLines[currentIndex - 1]
    ) {
      operations.push({
        type: 'equal',
        content: previousLines[previousIndex - 1],
      })
      previousIndex -= 1
      currentIndex -= 1
      continue
    }

    if (
      currentIndex > 0 &&
      (previousIndex === 0 || matrix[previousIndex][currentIndex - 1] >= matrix[previousIndex - 1][currentIndex])
    ) {
      operations.push({
        type: 'add',
        content: currentLines[currentIndex - 1],
      })
      currentIndex -= 1
      continue
    }

    operations.push({
      type: 'remove',
      content: previousLines[previousIndex - 1],
    })
    previousIndex -= 1
  }

  operations.reverse()
  return operations
}

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return []
  }

  return content.replace(/\r\n/g, '\n').split('\n')
}
