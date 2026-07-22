import { calculateJsonStats, isSafeUrl } from './api-utils'

export const DEFAULT_REMOTE_JSON_MAX_BYTES = 5 * 1024 * 1024
export const MCP_REMOTE_JSON_MAX_BYTES = 1024 * 1024

export class RemoteJsonError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'RemoteJsonError'
  }
}

export type RemoteJsonResult = {
  sourceUrl: string
  viewerUrl: string
  json: string
  parsed: unknown
  stats: ReturnType<typeof calculateJsonStats>
  size: number
  contentType: string | null
}

export function isTrustedPlatphormHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '')
  return normalized === 'platphormnews.com' || normalized.endsWith('.platphormnews.com')
}

export function createJsonGraphUrl(sourceUrl: string): string {
  const viewer = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com')
  viewer.searchParams.set('url', sourceUrl)
  viewer.searchParams.set('v', 'graph')
  return viewer.toString()
}

export async function fetchTrustedJsonUrl(
  sourceUrl: string,
  options: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<RemoteJsonResult> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    throw new RemoteJsonError('INVALID_URL', 'Invalid URL format', 400)
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new RemoteJsonError('UNSUPPORTED_PROTOCOL', 'Only HTTPS URLs are supported', 400)
  }
  if (!isTrustedPlatphormHost(parsedUrl.hostname)) {
    throw new RemoteJsonError(
      'UNTRUSTED_HOST',
      'Server-side URL import is limited to trusted *.platphormnews.com hosts.',
      403,
      { host: parsedUrl.hostname },
    )
  }
  if (!isSafeUrl(sourceUrl)) {
    throw new RemoteJsonError('UNSAFE_URL', 'The provided URL is not allowed', 400)
  }

  const maxBytes = options.maxBytes ?? DEFAULT_REMOTE_JSON_MAX_BYTES
  let response: Response
  try {
    response = await fetch(parsedUrl, {
      headers: {
        Accept: 'application/json, application/*+json, text/json',
        'User-Agent': 'JSON-Tree-PlatPhorm-Schema-Registry/1.4',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new RemoteJsonError('FETCH_TIMEOUT', 'Request timed out', 504)
    }
    throw new RemoteJsonError('FETCH_ERROR', 'Failed to fetch the trusted JSON URL', 502)
  }

  if (response.status >= 300 && response.status < 400) {
    throw new RemoteJsonError('REDIRECT_BLOCKED', 'Redirects are not followed for trusted JSON imports.', 502)
  }
  if (!response.ok) {
    throw new RemoteJsonError('FETCH_FAILED', `Failed to fetch URL: ${response.status} ${response.statusText}`, 502)
  }

  const declaredSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
    throw new RemoteJsonError('FETCHED_JSON_TOO_LARGE', `JSON response is too large (max ${formatByteLimit(maxBytes)})`, 413)
  }

  const json = await readBoundedText(response, maxBytes)
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new RemoteJsonError('FETCHED_INVALID_JSON', 'URL does not return valid JSON', 422)
  }

  return {
    sourceUrl: parsedUrl.toString(),
    viewerUrl: createJsonGraphUrl(parsedUrl.toString()),
    json,
    parsed,
    stats: calculateJsonStats(parsed),
    size: new TextEncoder().encode(json).byteLength,
    contentType: response.headers.get('content-type'),
  }
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new RemoteJsonError('FETCHED_JSON_TOO_LARGE', `JSON response is too large (max ${formatByteLimit(maxBytes)})`, 413)
    }
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

function formatByteLimit(bytes: number): string {
  return bytes % (1024 * 1024) === 0 ? `${bytes / (1024 * 1024)}MB` : `${bytes} bytes`
}
