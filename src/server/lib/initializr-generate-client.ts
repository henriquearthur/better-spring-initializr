export const INITIALIZR_GENERATE_URL = 'https://start.spring.io/starter.zip'

export type InitializrGenerateClientErrorCode = 'UPSTREAM_ERROR' | 'INVALID_RESPONSE'

export type FetchInitializrZipOptions = {
  params: Iterable<readonly [string, string]> | URLSearchParams
  signal?: AbortSignal
  fetch?: typeof fetch
  endpoint?: string
}

export type InitializrZipResponse = {
  bytes: Uint8Array
  contentType: string
  suggestedFilename: string
}

export class InitializrGenerateClientError extends Error {
  constructor(
    message: string,
    readonly code: InitializrGenerateClientErrorCode,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'InitializrGenerateClientError'
  }
}

export async function fetchInitializrZip(
  options: FetchInitializrZipOptions,
): Promise<InitializrZipResponse> {
  const fetchImpl = options.fetch ?? fetch
  const requestUrl = buildGenerateUrl(options.endpoint ?? INITIALIZR_GENERATE_URL, options.params)

  let response: Response

  try {
    response = await fetchImpl(requestUrl, {
      method: 'GET',
      headers: {
        accept: 'application/zip,application/octet-stream',
      },
      signal: options.signal,
    })
  } catch {
    throw new InitializrGenerateClientError(
      'Unable to reach Spring Initializr generation service.',
      'UPSTREAM_ERROR',
    )
  }

  if (!response.ok) {
    throw new InitializrGenerateClientError(
      'Spring Initializr archive request failed.',
      'UPSTREAM_ERROR',
      response.status,
    )
  }

  const bytes = await readResponseBytes(response)

  if (bytes.byteLength === 0) {
    throw new InitializrGenerateClientError(
      'Spring Initializr archive response was empty.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  return {
    bytes,
    contentType: normalizeContentType(response.headers.get('content-type')),
    suggestedFilename: parseSuggestedFilename(response.headers.get('content-disposition')),
  }
}

function buildGenerateUrl(
  endpoint: string,
  params: Iterable<readonly [string, string]> | URLSearchParams,
) {
  const url = new URL(endpoint)
  const searchParams =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(Array.from(params, ([key, value]) => [key, value]))

  url.search = searchParams.toString()

  return url
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  try {
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    throw new InitializrGenerateClientError(
      'Spring Initializr archive payload could not be read.',
      'INVALID_RESPONSE',
      response.status,
    )
  }
}

function normalizeContentType(contentTypeHeader: string | null): string {
  if (!contentTypeHeader) {
    return 'application/zip'
  }

  return contentTypeHeader.split(';', 1)[0].trim() || 'application/zip'
}

function parseSuggestedFilename(contentDispositionHeader: string | null): string {
  if (!contentDispositionHeader) {
    return 'demo.zip'
  }

  const encodedMatch = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i)

  if (encodedMatch && encodedMatch[1]) {
    try {
      const decoded = decodeURIComponent(encodedMatch[1])
      return sanitizeFilename(decoded)
    } catch {
      return 'demo.zip'
    }
  }

  const quotedMatch = contentDispositionHeader.match(/filename="([^"]+)"/i)

  if (quotedMatch && quotedMatch[1]) {
    return sanitizeFilename(quotedMatch[1])
  }

  const unquotedMatch = contentDispositionHeader.match(/filename=([^;]+)/i)

  if (unquotedMatch && unquotedMatch[1]) {
    return sanitizeFilename(unquotedMatch[1].trim())
  }

  return 'demo.zip'
}

function sanitizeFilename(filename: string): string {
  const normalized = filename.trim().replaceAll('\\', '/').split('/').pop() ?? ''

  return normalized || 'demo.zip'
}
