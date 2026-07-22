import type { JsonNode, JsonValueType, TreeStats, SearchResult, DiffResult } from './types'

export function getValueType(value: unknown): JsonValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as JsonValueType
}

export function parseJsonToTree(
  value: unknown,
  key: string = 'root',
  path: string[] = [],
  depth: number = 0
): JsonNode {
  let nodeIdCounter = 0

  function visit(currentValue: unknown, currentKey: string, currentPath: string[], currentDepth: number): JsonNode {
    const type = getValueType(currentValue)
    const node: JsonNode = {
      id: `node-${++nodeIdCounter}`,
      key: currentKey,
      value: currentValue,
      type,
      path: [...currentPath, currentKey],
      depth: currentDepth,
      isExpanded: currentDepth < 2,
    }

    if (type === 'object' && currentValue !== null) {
      node.children = Object.entries(currentValue as Record<string, unknown>).map(
        ([childKey, childValue]) => visit(childValue, childKey, node.path, currentDepth + 1),
      )
    } else if (type === 'array') {
      node.children = (currentValue as unknown[]).map((childValue, index) =>
        visit(childValue, String(index), node.path, currentDepth + 1),
      )
    }

    return node
  }

  return visit(value, key, path, depth)
}

export function calculateStats(node: JsonNode): TreeStats {
  const stats: TreeStats = {
    totalNodes: 0,
    maxDepth: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    objectCount: 0,
    arrayCount: 0
  }

  function traverse(n: JsonNode): void {
    stats.totalNodes++
    stats.maxDepth = Math.max(stats.maxDepth, n.depth)

    switch (n.type) {
      case 'string':
        stats.stringCount++
        break
      case 'number':
        stats.numberCount++
        break
      case 'boolean':
        stats.booleanCount++
        break
      case 'null':
        stats.nullCount++
        break
      case 'object':
        stats.objectCount++
        break
      case 'array':
        stats.arrayCount++
        break
    }

    if (n.children) {
      n.children.forEach(traverse)
    }
  }

  traverse(node)
  return stats
}

export function searchTree(
  node: JsonNode,
  query: string,
  caseSensitive: boolean = false
): SearchResult[] {
  const results: SearchResult[] = []
  const searchQuery = caseSensitive ? query : query.toLowerCase()

  function traverse(n: JsonNode): void {
    const key = caseSensitive ? n.key : n.key.toLowerCase()
    
    if (key.includes(searchQuery)) {
      results.push({
        node: n,
        matchType: 'key',
        matchText: n.key
      })
    }

    if (n.type === 'string' || n.type === 'number' || n.type === 'boolean') {
      const valueStr = String(n.value)
      const searchValue = caseSensitive ? valueStr : valueStr.toLowerCase()
      
      if (searchValue.includes(searchQuery)) {
        results.push({
          node: n,
          matchType: 'value',
          matchText: valueStr
        })
      }
    }

    if (n.children) {
      n.children.forEach(traverse)
    }
  }

  traverse(node)
  return results
}

export function formatJson(json: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed, null, indent)
  } catch {
    throw new Error('Invalid JSON')
  }
}

export function minifyJson(json: string): string {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed)
  } catch {
    throw new Error('Invalid JSON')
  }
}

export function validateJson(json: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(json)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export function diffJson(source: string, target: string): DiffResult {
  const sourceObj = JSON.parse(source)
  const targetObj = JSON.parse(target)
  
  const result: DiffResult = {
    added: [],
    removed: [],
    modified: []
  }

  function getAllPaths(obj: unknown, prefix: string = ''): Map<string, unknown> {
    const paths = new Map<string, unknown>()
    
    if (obj === null || typeof obj !== 'object') {
      paths.set(prefix || '$', obj)
      return paths
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemPaths = getAllPaths(item, `${prefix}[${index}]`)
        itemPaths.forEach((v, k) => paths.set(k, v))
      })
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key
        if (value !== null && typeof value === 'object') {
          const subPaths = getAllPaths(value, newPrefix)
          subPaths.forEach((v, k) => paths.set(k, v))
        } else {
          paths.set(newPrefix, value)
        }
      })
    }

    return paths
  }

  const sourcePaths = getAllPaths(sourceObj)
  const targetPaths = getAllPaths(targetObj)

  sourcePaths.forEach((value, path) => {
    if (!targetPaths.has(path)) {
      result.removed.push(path)
    } else if (JSON.stringify(value) !== JSON.stringify(targetPaths.get(path))) {
      result.modified.push({
        path,
        oldValue: value,
        newValue: targetPaths.get(path)
      })
    }
  })

  targetPaths.forEach((_, path) => {
    if (!sourcePaths.has(path)) {
      result.added.push(path)
    }
  })

  return result
}

export function getNodeAtPath(root: JsonNode, path: string[]): JsonNode | null {
  let current: JsonNode | undefined = root
  
  for (let i = 1; i < path.length; i++) {
    if (!current?.children) return null
    current = current.children.find(c => c.key === path[i])
    if (!current) return null
  }
  
  return current || null
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getValueColor(type: JsonValueType): string {
  switch (type) {
    case 'string':
      return 'text-emerald-500 dark:text-emerald-400'
    case 'number':
      return 'text-blue-500 dark:text-blue-400'
    case 'boolean':
      return 'text-amber-500 dark:text-amber-400'
    case 'null':
      return 'text-gray-400 dark:text-gray-500'
    case 'object':
    case 'array':
      return 'text-purple-500 dark:text-purple-400'
    default:
      return 'text-foreground'
  }
}

export function truncateValue(value: string, maxLength: number = 100): string {
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength) + '...'
}
