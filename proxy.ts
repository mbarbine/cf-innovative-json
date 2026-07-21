import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  if (!headers.has('x-platphorm-request-started-at')) {
    headers.set('x-platphorm-request-started-at', new Date().toISOString())
  }
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/api/:path*', '/v0/:path*'],
}
