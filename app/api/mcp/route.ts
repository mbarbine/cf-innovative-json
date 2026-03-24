import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

const MCP_VERSION = '2024-11-05'
const SERVER_NAME = 'platphorm-schema-registry'
const SERVER_VERSION = '1.0.0'

type McpRequest = {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

type McpResponse = {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

// PlatPhorm specific tools + Legacy JSON tools for utility
const tools = [
  {
    name: 'network.get_universe',
    description: 'Get details about the PlatPhorm universe',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Universe ID or slug' }
      },
      required: ['id']
    }
  },
  {
    name: 'network.list_realms',
    description: 'List active realms in the universe',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max records' }
      }
    }
  },
  {
    name: 'network.get_realm',
    description: 'Get realm configuration and capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Realm ID or slug' }
      },
      required: ['id']
    }
  },
  {
    name: 'network.get_trace',
    description: 'Retrieve a network trace by ID',
    inputSchema: {
      type: 'object',
      properties: {
        traceId: { type: 'string' }
      },
      required: ['traceId']
    }
  },
  {
    name: 'network.get_request',
    description: 'Retrieve request observation details',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string' }
      },
      required: ['requestId']
    }
  },
  {
    name: 'network.get_provenance',
    description: 'Get provenance lineage for an item',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string' }
      },
      required: ['itemId']
    }
  },
  {
    name: 'network.get_fingerprint',
    description: 'Retrieve a fingerprint record',
    inputSchema: {
      type: 'object',
      properties: {
        fingerprintId: { type: 'string' }
      },
      required: ['fingerprintId']
    }
  },
  {
    name: 'network.get_agent_run',
    description: 'Get details of an agent execution',
    inputSchema: {
      type: 'object',
      properties: {
        runId: { type: 'string' }
      },
      required: ['runId']
    }
  },
  {
    name: 'content.get_item',
    description: 'Get a specific item by FQID or public ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'content.search',
    description: 'Search content items across the realm',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query']
    }
  }
]

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  // Stubbed implementation for the registry.
  // In a real network node, these would query the database or forward to the central hub.
  switch (name) {
    case 'network.get_universe':
      return { id: 1, name: 'PlatPhorm', slug: 'platphorm', environment: 'production' };
    case 'network.list_realms':
      return { realms: [{ id: 1, slug: 'platphorm-schema-registry' }] };
    case 'network.get_realm':
      return { id: 1, slug: 'platphorm-schema-registry', realm_type: 'documentation-platform' };
    case 'network.get_trace':
    case 'network.get_request':
    case 'network.get_provenance':
    case 'network.get_fingerprint':
    case 'network.get_agent_run':
    case 'content.get_item':
    case 'content.search':
      return { 
        status: 'stub',
        message: `Tool ${name} received in Schema Registry. Network data is managed by the root observer.`,
        received_args: args
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function handleInitialize(): McpResponse {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: {
      protocolVersion: MCP_VERSION,
      capabilities: {
        tools: {},
        resources: {
          listChanged: false
        }
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

function handleListResources(id: string | number): McpResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      resources: [
        { uri: 'resource://universes/1', name: 'PlatPhorm Universe' },
        { uri: 'resource://realms/1', name: 'Schema Registry Realm' }
      ]
    }
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
  // Discovery route
  return NextResponse.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: MCP_VERSION,
    description: 'PlatPhorm MCP Server - Network contract tools',
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

      case 'resources/list':
        response = handleListResources(body.id)
        break
      
      case 'tools/call':
        response = await handleCallTool(body.id, body.params as { name: string; arguments?: Record<string, unknown> })
        break
      
      case 'notifications/initialized':
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
