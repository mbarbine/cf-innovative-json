import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docs.platphormnews.com'

export async function GET() {
  const content = `# PlatPhorm Schema Registry (Full)

This file contains the complete specification for the PlatPhorm Universal Schema Pack and how to interact with the API and MCP server.

## Overview
PlatPhorm Schema Registry is the documentation and registry realm for the entire PlatPhorm network.
It enforces the universal schema pack contract on all sub-realms.

## The Contract

Every site is a \`realm\`.
Every realm belongs to a \`universe\`.
Every route surface belongs to a \`namespace\`.
Every content or operational record is an \`item\` or a typed extension of it.

### Required Routes on All PlatPhorm Realms:
- \`/\`
- \`/api/health\`
- \`/api/docs\`
- \`/api/mcp\`
- \`/llms.txt\`
- \`/llms-full.txt\`
- \`/llms-index.json\`
- \`/.well-known/platphorm.json\`
- \`/robots.txt\`
- \`/sitemap.xml\`
- \`/manifest.webmanifest\`

## API Endpoints (v0)

- \`/v0/maxitem\`: Returns the max item ID
- \`/v0/updates\`: Returns recent items
- \`/v0/item/{id}\`: Returns a specific item
- \`/v0/items?ids=1,2,3\`: Returns multiple items
- \`/v0/search?q={query}\`: Search items
- \`/v0/universes\`: List universes
- \`/v0/realms\`: List realms

## MCP Tools

The MCP Server exposed at \`/api/mcp\` provides the following required tools:
- \`network.get_universe\`
- \`network.list_realms\`
- \`network.get_realm\`
- \`network.get_trace\`
- \`network.get_request\`
- \`network.get_provenance\`
- \`network.get_fingerprint\`
- \`network.get_agent_run\`
- \`content.get_item\`
- \`content.search\`

This site acts as the canonical registry for these tools.
`

  return new NextResponse(content, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
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
