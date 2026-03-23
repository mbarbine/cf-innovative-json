import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

export async function GET(request: Request) {
  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/llms.txt', url.origin), {
    headers: corsHeaders(),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
