import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

export async function GET() {
  const healthData = {
    status: 'active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    realm: {
      id: 1,
      slug: 'platphorm-schema-registry',
      environment: 'production',
      trust_level: 'standard'
    },
    capabilities: {
      api: true,
      mcp: true,
      health: true,
      llms: true,
      sitemap: true,
      robots: true
    }
  }

  return NextResponse.json(healthData, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
