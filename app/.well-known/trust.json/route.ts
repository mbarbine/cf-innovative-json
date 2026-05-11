import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { buildTrustPolicy } from '@/lib/discovery'

export async function GET() {
  return NextResponse.json(buildTrustPolicy(), {
    headers: {
      ...corsHeaders(),
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function OPTIONS() {
  return createOptionsResponse()
}
