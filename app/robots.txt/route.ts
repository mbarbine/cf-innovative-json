import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'
import { getDeploymentConfig } from '@/lib/deployment'

export async function GET() {
  const deployment = getDeploymentConfig()
  if (deployment.canary && !deployment.publicDiscovery) {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    })
  }

  const baseUrl = deployment.canary ? deployment.appUrl : deployment.canonicalUrl
  const content = `User-agent: *
Allow: /
Allow: /api/docs
Allow: /api/mcp
Allow: /api/health
Allow: /api/v1/health
Allow: /.well-known/platphorm.json
Allow: /.well-known/trust.json
Allow: /.well-known/mcp.json
Allow: /schemas/
Allow: /v0/
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /llms-index.json
Allow: /rss.xml
Allow: /feed.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-main.xml
Sitemap: ${baseUrl}/sitemap-index.xml
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
