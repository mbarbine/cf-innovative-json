import { NextRequest } from 'next/server'
import { apiError, apiResponse, checkRateLimit, createOptionsResponse, getClientIP } from '@/lib/api-utils'
import { validateJsonAgainstSchema } from '@/lib/schema-registry'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const rateLimit = checkRateLimit(getClientIP(request))
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'schema_validate')
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const json = body?.json
    const schemaSlug = body?.schemaSlug || body?.schema || 'core'

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'schema_validate')
    }

    if (!schemaSlug || typeof schemaSlug !== 'string') {
      return apiError('Missing or invalid "schemaSlug" field. Expected a string.', 400, requestId, 'INVALID_SCHEMA_FIELD', undefined, request.headers, 'schema_validate')
    }

    return apiResponse(validateJsonAgainstSchema(json, schemaSlug), 200, requestId, request.headers, 'schema_validate')
  } catch (error) {
    console.error('Schema validation failed', error)
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'schema_validate')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
