import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { BASE_URL, PRODUCT_NAME } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      service: 'json',
      name: PRODUCT_NAME,
      baseUrl: BASE_URL,
      agentOperable: true,
      publicSafeActions: ['parse_json', 'format_json', 'minify_json', 'validate_json', 'get_json_stats', 'list_schemas', 'get_schema_pack'],
      futureProtectedActions: ['registry_mutation', 'private_validation', 'report_generation', 'cross_site_sync'],
      mcp: `${BASE_URL}/api/mcp`,
      openapi: `${BASE_URL}/openapi.yaml`,
      trust: `${BASE_URL}/.well-known/trust.json`,
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
