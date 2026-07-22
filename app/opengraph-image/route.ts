import { NextRequest, NextResponse } from 'next/server'

// Preserve the historical route while using the already-bundled static social image.
// This avoids an edge-only ImageResponse dependency in the OpenNext Worker build.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/og-image.jpg', request.url), {
    status: 307,
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  })
}
