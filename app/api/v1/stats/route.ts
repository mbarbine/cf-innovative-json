import { NextRequest } from 'next/server'
import { apiError, apiResponse, calculateJsonStats, checkRateLimit, createOptionsResponse, getClientIP, validateJsonString } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const rateLimit = checkRateLimit(getClientIP(request))
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'json_stats')
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const json = body?.json
    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'json_stats')
    }

    const validation = validateJsonString(json)
    if (!validation.valid) {
      return apiError(`Invalid JSON: ${validation.error}`, 400, requestId, 'INVALID_JSON', { line: validation.line, column: validation.column }, request.headers, 'json_stats')
    }

    return apiResponse(calculateJsonStats(validation.parsed), 200, requestId, request.headers, 'json_stats')
  } catch {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'json_stats')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
