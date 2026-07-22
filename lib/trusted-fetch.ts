import { isSafeUrl } from './api-utils'

export const MAX_FETCHED_JSON_BYTES = 5 * 1024 * 1024
export const MAX_REDIRECT_HOPS = 3

export class TrustedFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'TrustedFetchError'
  }
}

export function isTrustedPlatphormHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '')
  return normalized === 'platphormnews.com' || normalized.endsWith('.platphormnews.com')
}

export function validateTrustedFetchUrl(input: string): URL {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new TrustedFetchError('Invalid URL format', 400, 'INVALID_URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TrustedFetchError('Only HTTP and HTTPS URLs are supported', 400, 'UNSUPPORTED_PROTOCOL')
  }
  if (url.username || url.password) {
    throw new TrustedFetchError('Credentialed URLs are not allowed', 400, 'CREDENTIALED_URL')
  }
  if (!isTrustedPlatphormHost(url.hostname)) {
    throw new TrustedFetchError(
      'Server-side URL import is limited to trusted platphormnews.com hosts.',
      403,
      'UNTRUSTED_HOST',
    )
  }
  if (!isSafeUrl(url.href)) {
    throw new TrustedFetchError('The provided URL is not allowed', 400, 'UNSAFE_URL')
  }
  return url
}

function safeTraceHeaders(headers?: Headers): Record<string, string> {
  if (!headers) return {}
  const result: Record<string, string> = {}
  const traceparent = headers.get('traceparent')
  if (traceparent && /^00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}$/i.test(traceparent)) {
    result.traceparent = traceparent
  }
  const tracestate = headers.get('tracestate')
  if (tracestate && tracestate.length <= 512 && /^[\x20-\x7e]+$/.test(tracestate) && !/(authorization|cookie|secret|token|api.?key)/i.test(tracestate)) {
    result.tracestate = tracestate
  }
  return result
}

async function readBoundedBody(response: Response): Promise<{ text: string; size: number }> {
  const contentLength = response.headers.get('content-length')
  if (contentLength) {
    const declared = Number(contentLength)
    if (Number.isFinite(declared) && declared > MAX_FETCHED_JSON_BYTES) {
      await response.body?.cancel()
      throw new TrustedFetchError('JSON response is too large (max 5 MiB)', 413, 'FETCHED_JSON_TOO_LARGE')
    }
  }

  if (!response.body) return { text: '', size: 0 }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_FETCHED_JSON_BYTES) {
      await reader.cancel('response exceeds the five-MiB limit')
      throw new TrustedFetchError('JSON response is too large (max 5 MiB)', 413, 'FETCHED_JSON_TOO_LARGE')
    }
    chunks.push(value)
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { text: new TextDecoder().decode(body), size }
}

export async function fetchTrustedJson(
  input: string,
  options: {
    signal: AbortSignal
    requestHeaders?: Headers
    fetchImpl?: typeof fetch
  },
): Promise<{ text: string; size: number; contentType: string | null; finalUrl: string; redirects: number }> {
  const fetchImpl = options.fetchImpl || fetch
  let current = validateTrustedFetchUrl(input)
  const visited = new Set<string>()
  let redirects = 0

  while (true) {
    if (visited.has(current.href)) {
      throw new TrustedFetchError('Redirect loop detected', 502, 'REDIRECT_LOOP')
    }
    visited.add(current.href)

    const response = await fetchImpl(current.href, {
      redirect: 'manual',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'JSON-Tree-PlatPhorm-Schema-Registry/1.0',
        ...safeTraceHeaders(options.requestHeaders),
      },
      signal: options.signal,
    })

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) throw new TrustedFetchError('Redirect response is missing a Location header', 502, 'INVALID_REDIRECT')
      if (redirects >= MAX_REDIRECT_HOPS) {
        throw new TrustedFetchError('Too many redirects', 502, 'TOO_MANY_REDIRECTS')
      }
      current = validateTrustedFetchUrl(new URL(location, current).href)
      redirects++
      continue
    }

    if (!response.ok) {
      await response.body?.cancel()
      throw new TrustedFetchError(`Failed to fetch URL: ${response.status}`, 502, 'FETCH_FAILED')
    }

    const body = await readBoundedBody(response)
    try {
      JSON.parse(body.text)
    } catch {
      throw new TrustedFetchError('URL does not return valid JSON', 422, 'FETCHED_INVALID_JSON')
    }

    return {
      ...body,
      contentType: response.headers.get('content-type'),
      finalUrl: current.href,
      redirects,
    }
  }
}
