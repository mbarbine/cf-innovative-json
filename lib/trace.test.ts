import { afterEach, describe, expect, it, vi } from 'vitest'

import { createTraceContext, exportJsonSpan, isRudimentaryJsonOperation } from './trace'

describe('JSON trace export', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it.each(['health', 'list_schemas', 'get_schema', 'schema_pack', 'jsonld_artifacts', 'mcp_register_info'])(
    'classifies %s as rudimentary',
    (operation) => {
      expect(isRudimentaryJsonOperation(operation)).toBe(true)
    },
  )

  it.each(['format_json', 'parse_json', 'minify_json', 'validate_json', 'diff_json', 'json_stats', 'fetch_json_url', 'cron_refresh'])(
    'keeps %s as a meaningful action',
    (operation) => {
      expect(isRudimentaryJsonOperation(operation)).toBe(false)
    },
  )

  it('suppresses a successful health trace before any network request', async () => {
    vi.stubEnv('PLATPHORM_API_KEY', 'test-platform-key')
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)

    const result = await exportJsonSpan({
      context: createTraceContext(new Headers(), 'health'),
      operation: 'health',
      startTime: '2026-07-22T12:00:00.000Z',
      status: 'completed',
      summary: {
        intent: 'Read health.',
        input: 'No product input.',
        output: 'Healthy.',
        evidence: 'Health response.',
      },
    })

    expect(result.status).toBe('suppressed')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('retains a failed health request as operational evidence', async () => {
    vi.stubEnv('PLATPHORM_API_KEY', 'test-platform-key')
    const fetcher = vi.fn(async () => new Response('{}', { status: 503 }))
    vi.stubGlobal('fetch', fetcher)

    const result = await exportJsonSpan({
      context: createTraceContext(new Headers(), 'health'),
      operation: 'health',
      startTime: '2026-07-22T12:00:00.000Z',
      status: 'failed',
      summary: {
        intent: 'Read health.',
        input: 'No product input.',
        output: 'Unavailable.',
        evidence: 'Health failure.',
      },
    })

    expect(result.status).toBe('degraded')
    expect(fetcher).toHaveBeenCalledOnce()
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
