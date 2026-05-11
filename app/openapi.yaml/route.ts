import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { openApiSpec } from '@/lib/openapi'
import { toYaml } from '@/lib/yaml'

export async function GET() {
  return new NextResponse(`${toYaml(openApiSpec)}\n`, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/yaml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function OPTIONS() {
  return createOptionsResponse()
}
