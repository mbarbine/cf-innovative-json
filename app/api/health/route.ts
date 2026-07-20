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
  const traceContextAccepted = Boolean(request?.headers.get("traceparent"))
  const traceContextPropagated = traceContextAccepted
  const vercelMetadataCaptured = headers ? Boolean(headers.get("x-vercel-id") || headers.get("x-vercel-cache")) : false

  return apiResponse(
    {
      service: SERVICE_ID,
      product: PRODUCT_NAME,
      version: APP_VERSION,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      status: schemaPack.status === 'active' ? 'active' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      routeComplianceScore: getRouteCompliance().score,
      observabilityComplianceScore: schemaPack.status === 'active' ? 1 : 0.82,
      database: {
        status: process.env.DATABASE_URL ? 'configured' : 'degraded',
        storageMode: process.env.DATABASE_URL ? 'server' : 'browser-local-and-static-public-files',
      },
      mcp: { status: 'active', endpoint: '/api/mcp' },
      trace: {
        status: 'active',
        traceEnabled: true,
        traceExportEnabled: false,
        traceContextAccepted,
        traceContextPropagated,
      },
      routeCompliance: getRouteCompliance(),
      discoveryCompliance: getDiscoveryCompliance(),
      schemaPack,
      auth: getAuthPolicy('future-protected'),
      modelIntegration: getModelAdapterStatus(headers),
      trustedDomainStatus: '*.platphormnews.com',
      traceEnabled: true,
      traceExportEnabled: false,
      traceContextAccepted,
      traceContextPropagated,
      lastTraceExportAt: null,
      spansEmittedLast24h: 0,
      propagationTestStatus: 'not_run',
      redactionStatus: 'enabled',
      vercelMetadataCaptured,
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
