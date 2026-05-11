import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { BASE_URL, PRODUCT_NAME } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      schema_version: 'v1',
      name_for_human: PRODUCT_NAME,
      name_for_model: 'json_tree_platphorm_schema_registry',
      description_for_human: 'Public JSON tree viewer, formatter, validator, and PlatPhorm schema registry.',
      description_for_model: 'Use public-safe JSON and schema tools only. Do not send secrets or PLATPHORM_API_KEY.',
      auth: { type: 'none' },
      api: { type: 'openapi', url: `${BASE_URL}/openapi.yaml` },
      logo_url: `${BASE_URL}/icon.svg`,
      contact_email: 'security@platphormnews.com',
      legal_info_url: `${BASE_URL}/.well-known/trust.json`,
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
