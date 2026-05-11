import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { buildSitemapXml } from '@/lib/discovery'

export async function GET() {
  return new NextResponse(buildSitemapXml(), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function OPTIONS() {
  return createOptionsResponse()
}
