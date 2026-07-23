import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SECURITY_CONTROLS_JSON,
  DEFAULT_SECURITY_CONTROLS_VIEW,
  formatSecuritySnapshotTime,
  getSecurityControlTone,
  loadSecurityControlsSnapshot,
  SECURITY_CONTROLS_SOURCE_URL,
} from './security-controls'
import { SECURITY_PRESENTATION_STEPS } from '@/components/json-tree/security-presentation-guide'

describe('security controls demo source', () => {
  it('defaults the canary experience to graph mode', () => {
    expect(DEFAULT_SECURITY_CONTROLS_VIEW).toBe('graph')
  })

  it('assigns semantic tones to Cloudflare control branches', () => {
    expect(getSecurityControlTone(['root', 'data', 'waf', 'status'])).toBe('waf')
    expect(getSecurityControlTone(['root', 'data', 'bots'])).toBe('bots')
    expect(getSecurityControlTone(['root', 'data', 'apiGateway', 'operations', '0'])).toBe('apiGateway')
    expect(getSecurityControlTone(['root', 'data', 'rateLimit', 'policy'])).toBe('rateLimit')
    expect(getSecurityControlTone(['root', 'data', 'capturedAt'])).toBeNull()
  })

  it('keeps the guided demo in the intended security-control order', () => {
    expect(SECURITY_PRESENTATION_STEPS.map(step => step.tone)).toEqual([
      'waf',
      'bots',
      'apiGateway',
      'rateLimit',
    ])
    expect(SECURITY_PRESENTATION_STEPS.every(step => step.proof.length > 0)).toBe(true)
  })

  it('formats snapshot time deterministically for server and browser hydration', () => {
    expect(formatSecuritySnapshotTime('2026-07-22T04:02:54Z')).toBe('2026-07-22 04:02:54 UTC')
    expect(formatSecuritySnapshotTime(null)).toBeNull()
    expect(formatSecuritySnapshotTime('not-a-date')).toBe('not-a-date')
  })

  it('formats a valid live snapshot for the graph', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { capturedAt: '2026-07-22T04:02:54Z', waf: {} } }), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    )

    const snapshot = await loadSecurityControlsSnapshot(fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      SECURITY_CONTROLS_SOURCE_URL,
      expect.objectContaining({ cache: 'no-store' }),
    )
    expect(snapshot.live).toBe(true)
    expect(snapshot.capturedAt).toBe('2026-07-22T04:02:54Z')
    expect(JSON.parse(snapshot.json)).toMatchObject({ ok: true, data: { waf: {} } })
  })

  it('uses a labeled fallback for invalid or unavailable upstream data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const snapshot = await loadSecurityControlsSnapshot(fetcher)

    expect(snapshot.live).toBe(false)
    expect(snapshot.json).toBe(DEFAULT_SECURITY_CONTROLS_JSON)
    expect(JSON.parse(snapshot.json).data.status).toBe('live-source-unavailable')
  })
})
