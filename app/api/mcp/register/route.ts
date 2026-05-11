import { NextRequest } from 'next/server'
import { apiError, apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { verifyPlatformAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = verifyPlatformAuth(request, 'protected')
  const requestId = request.headers.get('x-request-id') || undefined

  if (!auth.allowed) {
    return apiError(auth.reason, 401, requestId, 'AUTH_REQUIRED', { boundary: auth.boundary }, request.headers, 'mcp_register')
  }

  return apiResponse(
    {
      status: 'degraded',
      message: 'MCP registry mutation is scaffolded as a future protected action. No external registration was executed in Phase 1.',
    },
    200,
    requestId,
    request.headers,
    'mcp_register',
  )
}

export async function GET(request: NextRequest) {
  return apiResponse(
    {
      status: 'future-protected',
      message: 'Use POST with PLATPHORM_API_KEY after registry mutation is configured.',
    },
    200,
    request.headers.get('x-request-id') || undefined,
    request.headers,
    'mcp_register_info',
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
