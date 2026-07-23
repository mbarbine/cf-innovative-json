import { describe, expect, it } from 'vitest'
import { fetchTrustedJson, MAX_FETCHED_JSON_BYTES, TrustedFetchError, validateTrustedFetchUrl } from './trusted-fetch'

const signal = () => new AbortController().signal
const asFetch = (handler: (url: string, init?: RequestInit) => Promise<Response>) => handler as typeof fetch

describe('trusted JSON fetch', () => {
  it('accepts a trusted direct JSON URL and forwards valid trace context', async () => {
    let outboundHeaders = new Headers()
    const fetchImpl = asFetch(async (_url, init) => {
      outboundHeaders = new Headers(init?.headers)
      return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
    })
    const requestHeaders = new Headers({
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
      tracestate: 'vendor=value',
    })
    const result = await fetchTrustedJson('https://json.platphormnews.com/api/health', { signal: signal(), requestHeaders, fetchImpl })
    expect(result.text).toBe('{"ok":true}')
    expect(result.redirects).toBe(0)
    expect(outboundHeaders.get('traceparent')).toBe(requestHeaders.get('traceparent'))
  })

  it.each([
    'https://innovativefuturesolutions.com/api/security-controls',
    'https://www.innovativefuturesolutions.com/api/health',
    'https://platphorm-json-canary.barbine-michael.workers.dev/api/health',
  ])('accepts the exact public Cloudflare demo origin %s', (url) => {
    expect(validateTrustedFetchUrl(url).toString()).toBe(url)
  })

  it.each([
    ['https://example.com/data.json', 'UNTRUSTED_HOST'],
    ['https://another-worker.workers.dev/data.json', 'UNTRUSTED_HOST'],
    ['http://127.0.0.1/data.json', 'UNTRUSTED_HOST'],
    ['https://user:password@json.platphormnews.com/data.json', 'CREDENTIALED_URL'],
  ])('rejects unsafe input %s', (url, code) => {
    expect(() => validateTrustedFetchUrl(url)).toThrowError(TrustedFetchError)
    try { validateTrustedFetchUrl(url) } catch (error) { expect((error as TrustedFetchError).code).toBe(code) }
  })

  it('rejects a trusted-to-untrusted redirect', async () => {
    const fetchImpl = asFetch(async () => new Response(null, { status: 302, headers: { location: 'https://example.com/data.json' } }))
    await expect(fetchTrustedJson('https://json.platphormnews.com/start', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'UNTRUSTED_HOST' })
  })

  it('rejects redirect loops', async () => {
    const fetchImpl = asFetch(async (url) => new Response(null, { status: 302, headers: { location: url.endsWith('/a') ? '/b' : '/a' } }))
    await expect(fetchTrustedJson('https://json.platphormnews.com/a', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'REDIRECT_LOOP' })
  })

  it('rejects more than three redirect hops', async () => {
    const fetchImpl = asFetch(async (url) => {
      const step = Number(new URL(url).searchParams.get('step') || '0')
      return new Response(null, { status: 302, headers: { location: `/?step=${step + 1}` } })
    })
    await expect(fetchTrustedJson('https://json.platphormnews.com/?step=0', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'TOO_MANY_REDIRECTS' })
  })

  it('rejects an oversized Content-Length before buffering', async () => {
    const fetchImpl = asFetch(async () => new Response('{}', { headers: { 'content-length': String(MAX_FETCHED_JSON_BYTES + 1) } }))
    await expect(fetchTrustedJson('https://json.platphormnews.com/data.json', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'FETCHED_JSON_TOO_LARGE' })
  })

  it('cancels an oversized streamed body', async () => {
    let cancelled = false
    const chunk = new Uint8Array(1024 * 1024)
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(chunk) },
      cancel() { cancelled = true },
    })
    const fetchImpl = asFetch(async () => new Response(stream))
    await expect(fetchTrustedJson('https://json.platphormnews.com/data.json', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'FETCHED_JSON_TOO_LARGE' })
    expect(cancelled).toBe(true)
  })

  it('propagates a bounded fetch timeout', async () => {
    const fetchImpl = asFetch(async () => { throw new DOMException('timed out', 'TimeoutError') })
    await expect(fetchTrustedJson('https://json.platphormnews.com/data.json', { signal: signal(), fetchImpl })).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  it('rejects invalid JSON after the bounded read', async () => {
    const fetchImpl = asFetch(async () => new Response('not-json'))
    await expect(fetchTrustedJson('https://json.platphormnews.com/data.json', { signal: signal(), fetchImpl })).rejects.toMatchObject({ code: 'FETCHED_INVALID_JSON' })
  })
})
