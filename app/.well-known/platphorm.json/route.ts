import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { buildLlmsIndex, buildTrustPolicy, getDiscoveryCompliance, getRouteCompliance } from '@/lib/discovery'
import { BASE_URL, PRODUCT_NAME, SERVICE_DOMAIN } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      realm: {
        slug: 'json-tree-schema-registry',
        name: PRODUCT_NAME,
        realm_type: 'utility-platform',
        primary_domain: SERVICE_DOMAIN,
        canonical_url: BASE_URL,
        environment: process.env.VERCEL_ENV || 'production',
        visibility: 'public',
        status: 'active',
        trust_level: 'standard',
        feature_tags: ['json', 'schema-registry', 'api', 'mcp', 'llms', 'sitemap', 'health', 'docs'],
        network_manifest_url: `${BASE_URL}/.well-known/platphorm.json`,
        llms_url: `${BASE_URL}/llms.txt`,
        mcp_url: `${BASE_URL}/api/mcp`,
        docs_url: `${BASE_URL}/docs`,
        api_docs_url: `${BASE_URL}/api/docs`,
        health_url: `${BASE_URL}/api/health`,
        schema_pack_url: `${BASE_URL}/schemas/json/platphorm-universal-schema-pack.json`,
      },
      routeCompliance: getRouteCompliance(),
      discoveryCompliance: getDiscoveryCompliance(),
      trustPolicy: buildTrustPolicy(),
      llmsIndex: buildLlmsIndex(),
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
