import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS } from '@/lib/mcp'
import { BASE_URL, PRODUCT_NAME } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      name: PRODUCT_NAME,
      protocolVersion: '2024-11-05',
      endpoint: `${BASE_URL}/api/mcp`,
      publicReadOnly: true,
      tools: MCP_TOOLS.map(({ name, description }) => ({ name, description })),
      resources: MCP_RESOURCES,
      prompts: MCP_PROMPTS,
    },
    {
      headers: {
        ...corsHeaders(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
