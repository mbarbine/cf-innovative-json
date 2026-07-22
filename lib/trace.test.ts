import { afterEach, describe, expect, it, vi } from 'vitest'

import { createTraceContext, exportJsonSpan } from './trace'

describe('JSON trace export', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('does not emit children or a terminal record after the root start fails', async () => {
    vi.stubEnv('PLATPHORM_API_KEY', 'test-platform-key')
    const fetcher = vi.fn(async () => new Response('{}', { status: 503 }))
    vi.stubGlobal('fetch', fetcher)

    const result = await exportJsonSpan({
      context: createTraceContext(new Headers(), 'json.format'),
      operation: 'json.format',
      startTime: '2026-07-21T12:00:00.000Z',
      summary: {
        intent: 'Format JSON.',
        input: 'Validated JSON metadata.',
        output: 'Formatted JSON.',
        evidence: 'Trace-linked JSON lifecycle.',
      },
    })

    expect(result.status).toBe('degraded')
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
