import { NextRequest } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  createOptionsResponse,
  checkRateLimit, 
  getClientIP,
  validateJsonString,
  calculateJsonStats
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'validate_json')
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const { json } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'validate_json')
    }

    // Validate JSON
    const validation = validateJsonString(json)

    if (validation.valid) {
      const stats = calculateJsonStats(validation.parsed)
      return apiResponse(
        {
          valid: true,
          stats,
        },
        200,
        requestId,
        request.headers,
        'validate_json'
      )
    } else {
      return apiResponse(
        {
          valid: false,
          error: validation.error,
          line: validation.line,
          column: validation.column,
        },
        200,
        requestId,
        request.headers,
        'validate_json'
      )
    }
  } catch (error) {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'validate_json')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
