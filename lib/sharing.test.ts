import { describe, it, expect } from 'vitest'
import { createShareUrl, parseSourceUrlParams, parseUrlParams } from './sharing'
import type { ViewMode } from './types'

describe('sharing utils', () => {
  describe('createShareUrl and parseUrlParams', () => {
    it('generates a URL and parses it back to original state', () => {
      const json = '{"key":"value","arr":[1,2,3]}'
      const viewMode: ViewMode = 'graph'

      const url = createShareUrl({ json, viewMode })

      // Mock window.location for parsing
      const urlObj = new URL(url)
      Object.defineProperty(window, 'location', {
        value: {
          search: urlObj.search
        },
        writable: true
      })

      const parsed = parseUrlParams()

      expect(parsed?.json).toBe(json)
      expect(parsed?.viewMode).toBe(viewMode)
    })

    it('returns null when parsing empty search params', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: ''
        },
        writable: true
      })

      const parsed = parseUrlParams()
      expect(parsed).toBeNull()
    })

    it('defaults shared and source URL handoffs to graph view', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://json.platphormnews.com', search: '' },
        writable: true
      })
      const url = createShareUrl({ json: '{"source":"trace"}' })
      const urlObj = new URL(url)
      expect(urlObj.searchParams.has('v')).toBe(false)

      Object.defineProperty(window, 'location', {
        value: { search: urlObj.search },
        writable: true
      })
      expect(parseUrlParams()?.viewMode).toBe('graph')

      Object.defineProperty(window, 'location', {
        value: { search: '?url=https%3A%2F%2Ftrace.platphormnews.com%2Fapi%2Fv1%2Fworkflows' },
        writable: true
      })
      expect(parseSourceUrlParams()).toEqual({
        sourceUrl: 'https://trace.platphormnews.com/api/v1/workflows',
        viewMode: 'graph',
      })
    })
  })
})
