import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Return the SVG as favicon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <path d="M8 10h3l2 6-2 6H8l2-6-2-6z" fill="#fafafa"/>
  <path d="M24 10h-3l-2 6 2 6h3l-2-6 2-6z" fill="#fafafa"/>
  <circle cx="16" cy="16" r="2" fill="#fafafa"/>
</svg>`

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
