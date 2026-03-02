import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders, validateJsonString, formatJsonString, minifyJsonString, calculateJsonStats } from '@/lib/api-utils'
import { parseJsonToTree, calculateStats, resetNodeIdCounter, diffJson, searchTree } from '@/lib/json-utils'
import type { McpRequest, McpResponse, McpTool } from '@/lib/types'

const MCP_VERSION = '2024-11-05'
const SERVER_NAME = 'json-tree-mcp'
const SERVER_VERSION = '1.0.0'

// Define available tools
const tools: McpTool[] = [
  {
    name: 'parse_json',
    description: 'Parse a JSON string into a tree structure with statistics. Returns the parsed tree and metadata about the JSON structure including node counts, depth, and type distribution.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to parse',
        },
        includeStats: {
          type: 'boolean',
          description: 'Whether to include statistics (default: true)',
        },
      },
      required: ['json'],
    },
  },
  {
    name: 'format_json',
    description: 'Format (pretty-print) a JSON string with customizable indentation. Makes JSON human-readable.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to format',
        },
        indent: {
          type: 'number',
          description: 'Number of spaces for indentation (default: 2, max: 8)',
        },
      },
      required: ['json'],
    },
  },
  {
    name: 'minify_json',
    description: 'Minify a JSON string by removing all unnecessary whitespace. Reduces file size.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to minify',
        },
      },
      required: ['json'],
    },
  },
  {
    name: 'validate_json',
    description: 'Validate if a string is valid JSON. Returns validation result and error details if invalid.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to validate',
        },
      },
      required: ['json'],
    },
  },
  {
    name: 'diff_json',
    description: 'Compare two JSON objects and find differences. Returns added, removed, and modified paths.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'The source JSON string',
        },
        target: {
          type: 'string',
          description: 'The target JSON string to compare against',
        },
      },
      required: ['source', 'target'],
    },
  },
  {
    name: 'search_json',
    description: 'Search for keys or values within a JSON structure. Returns matching nodes with their paths.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to search in',
        },
        query: {
          type: 'string',
          description: 'The search query (searches in keys and values)',
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether the search is case-sensitive (default: false)',
        },
      },
      required: ['json', 'query'],
    },
  },
  {
    name: 'get_json_stats',
    description: 'Get detailed statistics about a JSON structure including node counts by type, depth, and size metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to analyze',
        },
      },
      required: ['json'],
    },
  },
]

// Tool execution handlers
async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'parse_json': {
      const { json, includeStats = true } = args as { json: string; includeStats?: boolean }
      const validation = validateJsonString(json)
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`)
      }
      resetNodeIdCounter()
      const tree = parseJsonToTree(validation.parsed)
      const stats = includeStats ? calculateStats(tree) : undefined
      return { tree, stats, valid: true }
    }

    case 'format_json': {
      const { json, indent = 2 } = args as { json: string; indent?: number }
      const indentNum = Math.min(Math.max(0, indent), 8)
      const validation = validateJsonString(json)
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`)
      }
      const formatted = formatJsonString(json, indentNum)
      return { formatted, length: formatted.length }
    }

    case 'minify_json': {
      const { json } = args as { json: string }
      const validation = validateJsonString(json)
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`)
      }
      const minified = minifyJsonString(json)
      return { 
        minified, 
        length: minified.length,
        originalLength: json.length,
        saved: json.length - minified.length
      }
    }

    case 'validate_json': {
      const { json } = args as { json: string }
      const validation = validateJsonString(json)
      if (validation.valid) {
        const stats = calculateJsonStats(validation.parsed)
        return { valid: true, stats }
      }
      return { valid: false, error: validation.error }
    }

    case 'diff_json': {
      const { source, target } = args as { source: string; target: string }
      const sourceValidation = validateJsonString(source)
      if (!sourceValidation.valid) {
        throw new Error(`Invalid source JSON: ${sourceValidation.error}`)
      }
      const targetValidation = validateJsonString(target)
      if (!targetValidation.valid) {
        throw new Error(`Invalid target JSON: ${targetValidation.error}`)
      }
      const diff = diffJson(source, target)
      return {
        diff,
        hasChanges: diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0,
        summary: {
          added: diff.added.length,
          removed: diff.removed.length,
          modified: diff.modified.length,
        },
      }
    }

    case 'search_json': {
      const { json, query, caseSensitive = false } = args as { 
        json: string; 
        query: string; 
        caseSensitive?: boolean 
      }
      const validation = validateJsonString(json)
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`)
      }
      resetNodeIdCounter()
      const tree = parseJsonToTree(validation.parsed)
      const results = searchTree(tree, query, caseSensitive)
      return {
        results: results.map(r => ({
          path: r.node.path.join('.'),
          key: r.node.key,
          matchType: r.matchType,
          matchText: r.matchText,
          value: r.node.value,
          type: r.node.type,
        })),
        totalMatches: results.length,
      }
    }

    case 'get_json_stats': {
      const { json } = args as { json: string }
      const validation = validateJsonString(json)
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`)
      }
      resetNodeIdCounter()
      const tree = parseJsonToTree(validation.parsed)
      const stats = calculateStats(tree)
      return {
        stats,
        sizeBytes: new TextEncoder().encode(json).length,
        sizeFormatted: json.length,
        sizeMinified: minifyJsonString(json).length,
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// MCP message handlers
function handleInitialize(): McpResponse {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: {
      protocolVersion: MCP_VERSION,
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
    },
  }
}

function handleListTools(id: string | number): McpResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      tools,
    },
  }
}

async function handleCallTool(id: string | number, params: { name: string; arguments?: Record<string, unknown> }): Promise<McpResponse> {
  try {
    const result = await executeTool(params.name, params.arguments || {})
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      },
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: (error as Error).message,
      },
    }
  }
}

export async function GET() {
  // Return server info for discovery
  return NextResponse.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: MCP_VERSION,
    description: 'JSON Tree MCP Server - Parse, format, validate, and analyze JSON',
    capabilities: {
      tools: tools.map(t => ({ name: t.name, description: t.description })),
    },
    endpoints: {
      mcp: '/api/mcp',
      sse: '/api/mcp/sse',
    },
  }, {
    headers: corsHeaders(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as McpRequest
    
    let response: McpResponse

    switch (body.method) {
      case 'initialize':
        response = handleInitialize()
        break
      
      case 'tools/list':
        response = handleListTools(body.id)
        break
      
      case 'tools/call':
        response = await handleCallTool(body.id, body.params as { name: string; arguments?: Record<string, unknown> })
        break
      
      case 'notifications/initialized':
        // Acknowledge but don't respond
        return new NextResponse(null, { status: 204 })
      
      default:
        response = {
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`,
          },
        }
    }

    return NextResponse.json(response, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('MCP error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
      },
    }, {
      status: 400,
      headers: corsHeaders(),
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
