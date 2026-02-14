import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import {
  unpackGeneratedProjectZip,
  UnpackGeneratedProjectError,
} from './unpack-generated-project'

describe('unpackGeneratedProjectZip', () => {
  it('decodes base64 zip and returns normalized file entries', async () => {
    const zip = new JSZip()
    zip.file('demo/README.md', '# demo')
    zip.file('demo/src/main/resources/logo.bin', new Uint8Array([0, 1, 2, 3]))
    const archiveBytes = await zip.generateAsync({ type: 'uint8array' })

    const files = await unpackGeneratedProjectZip(Buffer.from(archiveBytes).toString('base64'))

    expect(files).toEqual([
      {
        path: 'README.md',
        base64Content: 'IyBkZW1v',
        size: 6,
        binary: false,
      },
      {
        path: 'src/main/resources/logo.bin',
        base64Content: 'AAECAw==',
        size: 4,
        binary: true,
      },
    ])
  })

  it('rejects oversized unpacked archives', async () => {
    const zip = new JSZip()
    zip.file('demo/large.txt', 'abcdefghijklmnopqrstuvwxyz')
    const archiveBytes = await zip.generateAsync({ type: 'uint8array' })

    await expect(
      unpackGeneratedProjectZip(Buffer.from(archiveBytes).toString('base64'), {
        maxArchiveBytes: 1024 * 1024,
        maxUnpackedBytes: 8,
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof UnpackGeneratedProjectError && error.code === 'ARCHIVE_TOO_LARGE',
    )
  })
})
