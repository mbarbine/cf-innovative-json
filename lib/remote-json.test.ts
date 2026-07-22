import { afterEach, describe, expect, it, vi } from 'vitest'
import { createJsonGraphUrl, fetchTrustedJsonUrl, RemoteJsonError } from './remote-json'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('trusted remote JSON', () => {
  it('loads a trusted Trace JSON route and returns an attributable graph link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true,"data":{"workflows":[]}}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })))

    const result = await fetchTrustedJsonUrl('https://trace.platphormnews.com/api/v1/workflows')

    expect(result.parsed).toEqual({ ok: true, data: { workflows: [] } })
    expect(result.viewerUrl).toBe(createJsonGraphUrl(result.sourceUrl))
    expect(fetch).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }))
  })

  it('rejects non-HTTPS and non-PlatPhorm hosts before fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTrustedJsonUrl('http://trace.platphormnews.com/api/v1/workflows')).rejects.toMatchObject({ code: 'UNSUPPORTED_PROTOCOL' })
    await expect(fetchTrustedJsonUrl('https://example.com/data.json')).rejects.toMatchObject({ code: 'UNTRUSTED_HOST' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stops reading when the response exceeds the configured byte limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"large":"payload"}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })))

    await expect(fetchTrustedJsonUrl('https://trace.platphormnews.com/api/v1/workflows', { maxBytes: 5 }))
      .rejects.toBeInstanceOf(RemoteJsonError)
  })
})
