import { describe, expect, it, vi } from 'vitest'
import { requestStartedAt } from './api-utils'

describe('requestStartedAt', () => {
  it('uses the proxy-captured request start time', () => {
    vi.setSystemTime(new Date('2026-07-21T17:20:01.000Z'))
    const headers = new Headers({
      'x-platphorm-request-started-at': '2026-07-21T17:20:00.125Z',
    })

    expect(requestStartedAt(headers)).toBe('2026-07-21T17:20:00.125Z')
    vi.useRealTimers()
  })

  it('falls back safely when the supplied timestamp is invalid or stale', () => {
    vi.setSystemTime(new Date('2026-07-21T17:20:01.000Z'))

    expect(requestStartedAt(new Headers({ 'x-platphorm-request-started-at': 'not-a-date' })))
      .toBe('2026-07-21T17:20:01.000Z')
    expect(requestStartedAt(new Headers({ 'x-platphorm-request-started-at': '2026-07-21T16:00:00.000Z' })))
      .toBe('2026-07-21T17:20:01.000Z')
    vi.useRealTimers()
  })
})
