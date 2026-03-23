import { describe, it, expect } from 'vitest'
import { createShareUrl, parseUrlParams } from './sharing'
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
  })
})
