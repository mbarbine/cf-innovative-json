import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    realm: {
      slug: 'platphorm-schema-registry',
      name: 'PlatPhorm Schema Registry',
      realm_type: 'documentation-platform',
      primary_domain: 'json.platphormnews.com',
      canonical_url: 'https://json.platphormnews.com',
      environment: 'production',
      visibility: 'public',
      status: 'active',
      trust_level: 'standard',
      feature_tags: ['api', 'mcp', 'llms', 'sitemap', 'health', 'docs', 'json'],
      environment_tags: ['production'],
      governance_tags: ['public', 'open-source'],
      network_manifest_url: 'https://json.platphormnews.com/.well-known/platphorm.json',
      llms_url: 'https://json.platphormnews.com/llms.txt',
      mcp_url: 'https://json.platphormnews.com/api/mcp',
      docs_url: 'https://json.platphormnews.com/api/docs',
      health_url: 'https://json.platphormnews.com/api/health',
      capabilities: {
        api: true,
        mcp: true,
        health: true,
        llms: true,
        sitemap: true,
        robots: true
      }
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}
