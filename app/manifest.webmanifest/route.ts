import { NextResponse } from 'next/server'
import { corsHeaders, createOptionsResponse } from '@/lib/api-utils'
import { BASE_URL, PRODUCT_NAME } from '@/lib/platform'

export async function GET() {
  return NextResponse.json(
    {
      name: PRODUCT_NAME,
      short_name: 'JSON Tree',
      description: 'Public JSON tree viewer, formatter, validator, and PlatPhorm schema registry.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0a0f0d',
      theme_color: '#059669',
      icons: [
        { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
        { src: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
      ],
      related_applications: [],
      categories: ['developer', 'utilities', 'productivity'],
      id: BASE_URL,
    },
    {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    },
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
