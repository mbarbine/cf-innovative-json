import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { buildSitemapIndexXml } from '@/lib/discovery'

export async function GET() {
  return new NextResponse(buildSitemapIndexXml(), {
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
