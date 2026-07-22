import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { buildLlmsTxt } from '@/lib/discovery'

export async function GET() {
  return new NextResponse(buildLlmsTxt(), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function OPTIONS() {
  return createOptionsResponse()
}
