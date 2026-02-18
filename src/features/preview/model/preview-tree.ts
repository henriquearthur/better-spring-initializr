export type PreviewSnapshotFile = {
  path: string
  size: number
  binary: boolean
  hash: string
  content?: string
}

export type PreviewTreeNode = {
  id: string
  name: string
  path: string
  kind: 'directory' | 'file'
  file?: PreviewSnapshotFile
  children?: PreviewTreeNode[]
}

type MutableDirectoryNode = {
  name: string
  path: string
  directories: Map<string, MutableDirectoryNode>
  files: PreviewTreeNode[]
}

export function buildPreviewTree(files: PreviewSnapshotFile[]): PreviewTreeNode[] {
  const root = createMutableDirectoryNode('', '')

  for (const file of files) {
    const normalizedPath = normalizePath(file.path)

    if (!normalizedPath) {
      continue
    }

    const segments = normalizedPath.split('/')
    const fileName = segments[segments.length - 1]

    if (!fileName) {
      continue
    }

    const directoryPathSegments = segments.slice(0, -1)
    let directory = root

    for (const segment of directoryPathSegments) {
      let next = directory.directories.get(segment)

      if (!next) {
        const nextPath = directory.path ? `${directory.path}/${segment}` : segment
        next = createMutableDirectoryNode(segment, nextPath)
        directory.directories.set(segment, next)
      }

      directory = next
    }

    directory.files.push({
      id: `file:${normalizedPath}`,
      name: fileName,
      path: normalizedPath,
      kind: 'file',
      file,
    })
  }

  return finalizeDirectory(root)
}

function createMutableDirectoryNode(name: string, path: string): MutableDirectoryNode {
  return {
    name,
    path,
    directories: new Map(),
    files: [],
  }
}

function finalizeDirectory(directory: MutableDirectoryNode): PreviewTreeNode[] {
  const directoryNodes = Array.from(directory.directories.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((childDirectory) => ({
      id: `dir:${childDirectory.path}`,
      name: childDirectory.name,
      path: childDirectory.path,
      kind: 'directory' as const,
      children: finalizeDirectory(childDirectory),
    }))

  const fileNodes = [...directory.files].sort((left, right) => left.name.localeCompare(right.name))

  return [...directoryNodes, ...fileNodes]
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment.length > 0)
    .join('/')
}
