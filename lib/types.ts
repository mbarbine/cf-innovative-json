// JSON Tree Types
export interface JsonNode {
  id: string
  key: string
  value: unknown
  type: JsonValueType
  path: string[]
  depth: number
  children?: JsonNode[]
  isExpanded?: boolean
}

export type JsonValueType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'array'

export interface TreeStats {
  totalNodes: number
  maxDepth: number
  stringCount: number
  numberCount: number
  booleanCount: number
  nullCount: number
  objectCount: number
  arrayCount: number
}

export interface SearchResult {
  node: JsonNode
  matchType: 'key' | 'value'
  matchText: string
}

export type ViewMode = 'tree' | 'graph' | 'raw'

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
    traceId?: string
    spanId?: string
    traceUrl?: string
  }
}

export interface ParseRequest {
  json: string
  options?: {
    maxDepth?: number
    includeStats?: boolean
  }
}

export interface ParseResponse {
  tree: JsonNode
  stats: TreeStats
  valid: boolean
}

export interface FormatRequest {
  json: string
  indent?: number
}

export interface MinifyRequest {
  json: string
}

export interface ValidateRequest {
  json: string
  schema?: object
}

export interface DiffRequest {
  source: string
  target: string
}

export interface DiffResult {
  added: string[]
  removed: string[]
  modified: Array<{
    path: string
    oldValue: unknown
    newValue: unknown
  }>
}

// MCP Types
export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface McpRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: unknown
}

export interface McpResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

// OpenAPI Types
export interface OpenApiSpec {
  openapi: string
  info: {
    title: string
    description: string
    version: string
    contact?: {
      name: string
      url: string
      email: string
    }
    license?: {
      name: string
      url: string
    }
  }
  servers: Array<{
    url: string
    description: string
  }>
  paths: Record<string, unknown>
  components: Record<string, unknown>
}
