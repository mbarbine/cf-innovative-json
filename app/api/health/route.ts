import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getAuthPolicy } from '@/lib/auth'
import { getDiscoveryCompliance, getRouteCompliance } from '@/lib/discovery'
import { getModelAdapterStatus } from '@/lib/model-adapter'
import { getSchemaPack } from '@/lib/schema-registry'
import { APP_VERSION, PRODUCT_NAME, SERVICE_ID } from '@/lib/platform'

export async function GET(request?: NextRequest) {
  const headers = request?.headers
  const schemaPack = getSchemaPack()

  return apiResponse(
    {
      service: SERVICE_ID,
      product: PRODUCT_NAME,
      version: APP_VERSION,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      status: schemaPack.status === 'active' ? 'active' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: process.env.DATABASE_URL ? 'configured' : 'degraded',
        storageMode: process.env.DATABASE_URL ? 'server' : 'browser-local-and-static-public-files',
      },
      mcp: { status: 'active', endpoint: '/api/mcp' },
      trace: {
        status: 'active',
        traceEnabled: true,
        traceExportEnabled: false,
        traceContextAccepted: true,
        traceContextPropagated: true,
      },
      routeCompliance: getRouteCompliance(),
      discoveryCompliance: getDiscoveryCompliance(),
      schemaPack,
      auth: getAuthPolicy('future-protected'),
      modelIntegration: getModelAdapterStatus(headers),
    },
    200,
    headers?.get('x-request-id') || undefined,
    headers,
    'health',
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
