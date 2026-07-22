import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { BASE_URL } from '@/lib/platform'

export async function GET() {
  const body = `Contact: mailto:security@platphormnews.com
Policy: ${BASE_URL}/.well-known/trust.json
Preferred-Languages: en
Canonical: ${BASE_URL}/.well-known/security.txt
`

  return new NextResponse(body, {
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
