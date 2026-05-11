import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS, handleMcpRequest } from '@/lib/mcp'
import { BASE_URL, PRODUCT_NAME } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      name: 'json-tree-platphorm-schema-registry',
      product: PRODUCT_NAME,
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      description: 'Public-safe JSON Tree and PlatPhorm Schema Registry MCP server.',
      publicReadOnly: true,
      endpoint: `${BASE_URL}/api/mcp`,
      tools: MCP_TOOLS.map(({ name, description }) => ({ name, description })),
      resources: MCP_RESOURCES,
      prompts: MCP_PROMPTS,
      authPolicy: 'Public-safe tools are open in Phase 1. Future protected tools use PLATPHORM_API_KEY when enabled.',
    },
    {
      headers: {
        ...corsHeaders(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await handleMcpRequest(body, request.headers)

    if (response === null) return new NextResponse(null, { status: 204, headers: corsHeaders() })

    return NextResponse.json(response, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
        },
      },
      {
        status: 400,
        headers: corsHeaders(),
      },
    )
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
