import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docs.platphormnews.com'

export async function GET() {
  const content = `# PlatPhorm Schema Registry

> The universal contract and schema registry for the PlatPhorm network.
> Version: 1.0.0

## Overview

PlatPhorm Schema Registry is the core documentation platform that exposes:
- The PlatPhorm Universal Schema Pack
- API Reference & MCP Integration
- Network API & JSON-LD
- REST/MCP examples

## Website
${BASE_URL}

## Core Contract Files

The following strict JSON schema files define the network:
- ${BASE_URL}/schemas/json/platphorm-universal-schema-pack.json
- ${BASE_URL}/schemas/json/core.schema.json
- ${BASE_URL}/schemas/json/realm.schema.json
- ${BASE_URL}/schemas/json/item.schema.json
- ${BASE_URL}/schemas/json/observability.schema.json
- ${BASE_URL}/schemas/json/agent.schema.json

## API Endpoints

The network supports the v0 standard endpoints:
- GET /v0/universes
- GET /v0/realms
- GET /v0/realm/{id}/items

### System Endpoints
- GET /api/health
- GET /api/docs (OpenAPI 3.1)
- GET /.well-known/platphorm.json

## MCP Server

Endpoint: ${BASE_URL}/api/mcp

### Required Tools
- network.get_universe
- network.list_realms
- network.get_realm
- network.get_trace
- network.get_request
- network.get_provenance
- network.get_fingerprint
- network.get_agent_run
- content.get_item
- content.search

## Contact

Built by PlatPhorm
Website: https://platphormnews.com
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
