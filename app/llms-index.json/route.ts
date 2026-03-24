import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docs.platphormnews.com'

export async function GET() {
  const index = {
    name: 'PlatPhorm Schema Registry',
    description: 'The universal schema registry for the PlatPhorm network.',
    url: BASE_URL,
    version: '1.0.0',
    capabilities: {
      llm_discovery: true,
      mcp_server: true,
      api_docs: true,
      schema_registry: true
    },
    files: [
      {
        path: '/llms.txt',
        type: 'text/markdown',
        description: 'Compact LLM guide'
      },
      {
        path: '/llms-full.txt',
        type: 'text/markdown',
        description: 'Full LLM guide with examples'
      },
      {
        path: '/schemas/json/platphorm-universal-schema-pack.json',
        type: 'application/schema+json',
        description: 'The master PlatPhorm Universal Schema Pack'
      }
    ],
    endpoints: {
      mcp: '/api/mcp',
      docs: '/api/docs',
      health: '/api/health',
      manifest: '/.well-known/platphorm.json'
    }
  }

  return NextResponse.json(index, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
