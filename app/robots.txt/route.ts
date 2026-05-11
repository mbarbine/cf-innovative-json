import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com'

export async function GET() {
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

Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-main.xml
Sitemap: ${BASE_URL}/sitemap-index.xml
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
