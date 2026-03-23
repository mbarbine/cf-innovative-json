import { describe, it, expect, beforeEach } from 'vitest'
import {
  getValueType,
  generateNodeId,
  resetNodeIdCounter,
  parseJsonToTree,
  calculateStats,
  searchTree,
  formatJson,
  minifyJson,
  validateJson,
  diffJson,
  getNodeAtPath,
  getValueColor,
  truncateValue
} from './json-utils'

describe('json-utils', () => {
  beforeEach(() => {
    resetNodeIdCounter()
  })

  describe('getValueType', () => {
    it('returns null for null', () => expect(getValueType(null)).toBe('null'))
    it('returns array for arrays', () => expect(getValueType([1, 2])).toBe('array'))
    it('returns object for objects', () => expect(getValueType({ a: 1 })).toBe('object'))
    it('returns string for strings', () => expect(getValueType('hello')).toBe('string'))
    it('returns number for numbers', () => expect(getValueType(42)).toBe('number'))
    it('returns boolean for booleans', () => expect(getValueType(true)).toBe('boolean'))
  })

  describe('generateNodeId', () => {
    it('generates sequential ids', () => {
      expect(generateNodeId()).toBe('node-1')
      expect(generateNodeId()).toBe('node-2')
    })
  })

  describe('parseJsonToTree', () => {
    it('parses a simple object', () => {
      const tree = parseJsonToTree({ a: 1 })
      expect(tree.id).toBe('node-1')
      expect(tree.key).toBe('root')
      expect(tree.type).toBe('object')
      expect(tree.children?.length).toBe(1)
      expect(tree.children?.[0].key).toBe('a')
      expect(tree.children?.[0].value).toBe(1)
      expect(tree.children?.[0].type).toBe('number')
      expect(tree.children?.[0].path).toEqual(['root', 'a'])
    })

    it('parses an array', () => {
      const tree = parseJsonToTree([1, "two"])
      expect(tree.type).toBe('array')
      expect(tree.children?.length).toBe(2)
      expect(tree.children?.[0].key).toBe('0')
      expect(tree.children?.[0].value).toBe(1)
      expect(tree.children?.[1].key).toBe('1')
      expect(tree.children?.[1].value).toBe('two')
    })
  })

  describe('calculateStats', () => {
    it('calculates correct stats', () => {
      const tree = parseJsonToTree({ a: 1, b: "string", c: true, d: null, e: [1, 2] })
      const stats = calculateStats(tree)

      expect(stats.totalNodes).toBe(8) // root + 5 children + 2 array elements
      expect(stats.maxDepth).toBe(2)
      expect(stats.numberCount).toBe(3) // 1, 1, 2
      expect(stats.stringCount).toBe(1) // "string"
      expect(stats.booleanCount).toBe(1) // true
      expect(stats.nullCount).toBe(1) // null
      expect(stats.objectCount).toBe(1) // root
      expect(stats.arrayCount).toBe(1) // e
    })
  })

  describe('searchTree', () => {
    it('finds keys and values', () => {
      const tree = parseJsonToTree({ myKey: "myValue", anotherKey: 42 })

      const keyResults = searchTree(tree, 'myK')
      expect(keyResults.length).toBe(1)
      expect(keyResults[0].matchType).toBe('key')
      expect(keyResults[0].node.key).toBe('myKey')

      const valueResults = searchTree(tree, 'myVal')
      expect(valueResults.length).toBe(1)
      expect(valueResults[0].matchType).toBe('value')
      expect(valueResults[0].node.value).toBe('myValue')

      const numberResults = searchTree(tree, '42')
      expect(numberResults.length).toBe(1)
      expect(numberResults[0].node.value).toBe(42)
    })

    it('handles case sensitivity', () => {
      const tree = parseJsonToTree({ myKey: "myValue" })

      expect(searchTree(tree, 'MYK', false).length).toBe(1)
      expect(searchTree(tree, 'MYK', true).length).toBe(0)
    })
  })

  describe('formatJson', () => {
    it('formats json with default indent', () => {
      expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    })
    it('formats json with custom indent', () => {
      expect(formatJson('{"a":1}', 4)).toBe('{\n    "a": 1\n}')
    })
    it('throws on invalid json', () => {
      expect(() => formatJson('{a:1}')).toThrow('Invalid JSON')
    })
  })

  describe('minifyJson', () => {
    it('minifies json', () => {
      expect(minifyJson('{\n  "a": 1\n}')).toBe('{"a":1}')
    })
  })

  describe('validateJson', () => {
    it('validates correct json', () => {
      expect(validateJson('{"a":1}').valid).toBe(true)
    })
    it('invalidates bad json', () => {
      const res = validateJson('{a:1}')
      expect(res.valid).toBe(false)
      expect(res.error).toBeDefined()
    })
  })

  describe('diffJson', () => {
    it('finds additions', () => {
      const res = diffJson('{"a":1}', '{"a":1,"b":2}')
      expect(res.added).toContain('b')
      expect(res.removed.length).toBe(0)
      expect(res.modified.length).toBe(0)
    })
    it('finds removals', () => {
      const res = diffJson('{"a":1,"b":2}', '{"a":1}')
      expect(res.removed).toContain('b')
      expect(res.added.length).toBe(0)
      expect(res.modified.length).toBe(0)
    })
    it('finds modifications', () => {
      const res = diffJson('{"a":1}', '{"a":2}')
      expect(res.modified.length).toBe(1)
      expect(res.modified[0].path).toBe('a')
      expect(res.modified[0].oldValue).toBe(1)
      expect(res.modified[0].newValue).toBe(2)
    })
  })
})
