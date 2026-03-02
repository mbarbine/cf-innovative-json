import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi'
import { corsHeaders } from '@/lib/api-utils'

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
