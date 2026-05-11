import { NextRequest } from 'next/server'
import { apiError, apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { isVercelCronRequest, verifyPlatformAuth } from '@/lib/auth'
import { buildLlmsIndex, getDiscoveryCompliance, getPublicSitemapRoutes, getRouteCompliance } from '@/lib/discovery'
import { getSchemaPack } from '@/lib/schema-registry'

async function refresh(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const auth = verifyPlatformAuth(request, 'protected')
  const isCron = isVercelCronRequest(request)

  if (!auth.allowed && !isCron) {
    return apiError(auth.reason, 401, requestId, 'AUTH_REQUIRED', { accepted: ['Vercel Cron', 'PLATPHORM_API_KEY'] }, request.headers, 'cron_refresh')
  }

  const sitemapRoutes = getPublicSitemapRoutes()
  return apiResponse(
    {
      status: 'completed',
      bounded: true,
      idempotent: true,
      refreshed: ['schema metadata', 'route inventory', 'sitemap route inventory', 'rss/feed metadata', 'llms index', 'health summary'],
      schemaPack: getSchemaPack(),
      routeCompliance: getRouteCompliance(),
      discoveryCompliance: getDiscoveryCompliance(),
      sitemapRouteCount: sitemapRoutes.length,
      llmsIndex: buildLlmsIndex(),
      storageMode: 'ephemeral-refresh-summary',
    },
    200,
    requestId,
    request.headers,
    'cron_refresh',
  )
}

export async function GET(request: NextRequest) {
  return refresh(request)
}

export async function POST(request: NextRequest) {
  return refresh(request)
}

export async function OPTIONS() {
  return createOptionsResponse()
}
