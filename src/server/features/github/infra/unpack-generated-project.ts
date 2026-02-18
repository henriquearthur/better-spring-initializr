import JSZip from 'jszip'

const DEFAULT_MAX_ARCHIVE_BYTES = 15 * 1024 * 1024
const DEFAULT_MAX_UNPACKED_BYTES = 30 * 1024 * 1024
const DEFAULT_MAX_FILE_COUNT = 2000

export type UnpackedGeneratedProjectFile = {
  path: string
  base64Content: string
  size: number
  binary: boolean
}

export class UnpackGeneratedProjectError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_ARCHIVE' | 'ARCHIVE_TOO_LARGE',
  ) {
    super(message)
    this.name = 'UnpackGeneratedProjectError'
  }
}

type UnpackOptions = {
  maxArchiveBytes?: number
  maxUnpackedBytes?: number
  maxFileCount?: number
}

export async function unpackGeneratedProjectZip(
  archiveBase64: string,
  options: UnpackOptions = {},
): Promise<UnpackedGeneratedProjectFile[]> {
  const maxArchiveBytes = options.maxArchiveBytes ?? DEFAULT_MAX_ARCHIVE_BYTES
  const maxUnpackedBytes = options.maxUnpackedBytes ?? DEFAULT_MAX_UNPACKED_BYTES
  const maxFileCount = options.maxFileCount ?? DEFAULT_MAX_FILE_COUNT

  const archiveBytes = decodeBase64Archive(archiveBase64)

  if (archiveBytes.byteLength > maxArchiveBytes) {
    throw new UnpackGeneratedProjectError(
      'Generated archive exceeds allowed payload size.',
      'ARCHIVE_TOO_LARGE',
    )
  }

  let zip: JSZip

  try {
    zip = await JSZip.loadAsync(archiveBytes)
  } catch {
    throw new UnpackGeneratedProjectError(
      'Generated project archive could not be decoded.',
      'INVALID_ARCHIVE',
    )
  }

  const files: UnpackedGeneratedProjectFile[] = []
  let totalUnpackedBytes = 0

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue
    }

    const normalizedPath = normalizeArchivePath(entry.name)

    if (!normalizedPath || normalizedPath.includes('..')) {
      continue
    }

    const bytes = new Uint8Array(await entry.async('uint8array'))
    totalUnpackedBytes += bytes.byteLength

    if (files.length + 1 > maxFileCount || totalUnpackedBytes > maxUnpackedBytes) {
      throw new UnpackGeneratedProjectError(
        'Generated archive exceeds allowed unpacked size limits.',
        'ARCHIVE_TOO_LARGE',
      )
    }

    files.push({
      path: normalizedPath,
      base64Content: bytesToBase64(bytes),
      size: bytes.byteLength,
      binary: decodeUtf8IfText(bytes) === undefined,
    })
  }

  if (files.length === 0) {
    throw new UnpackGeneratedProjectError(
      'Generated archive did not contain any files to commit.',
      'INVALID_ARCHIVE',
    )
  }

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

function decodeBase64Archive(archiveBase64: string): Uint8Array {
  const normalized = archiveBase64.trim()

  if (normalized.length === 0) {
    throw new UnpackGeneratedProjectError('Generated archive payload was empty.', 'INVALID_ARCHIVE')
  }

  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(normalized, 'base64'))
    }

    const binary = atob(normalized)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  } catch {
    throw new UnpackGeneratedProjectError('Generated archive payload was invalid base64.', 'INVALID_ARCHIVE')
  }
}

function normalizeArchivePath(path: string): string {
  const index = path.indexOf('/')
  const withoutRoot = index === -1 ? path : path.slice(index + 1)

  return withoutRoot.replace(/^\/+/, '').trim()
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  let binary = ''

  for (const value of bytes) {
    binary += String.fromCharCode(value)
  }

  return btoa(binary)
}

function decodeUtf8IfText(bytes: Uint8Array): string | undefined {
  if (bytes.byteLength === 0) {
    return ''
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)

    return decoded.includes('\u0000') ? undefined : decoded
  } catch {
    return undefined
  }
}
