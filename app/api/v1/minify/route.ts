import { NextRequest } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  createOptionsResponse,
  checkRateLimit, 
  getClientIP,
  validateJsonString,
  minifyJsonString
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'minify_json')
  }

  try {
    const body = await request.json()
    const { json } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'minify_json')
    }

    // Validate JSON first
    const validation = validateJsonString(json)
    if (!validation.valid) {
      return apiError(`Invalid JSON: ${validation.error}`, 400, requestId, 'INVALID_JSON', { line: validation.line, column: validation.column }, request.headers, 'minify_json')
    }

    // Minify
    const minified = minifyJsonString(json)

    return apiResponse(
      {
        minified,
        length: minified.length,
        originalLength: json.length,
        saved: json.length - minified.length,
        savedPercent: Math.round((1 - minified.length / json.length) * 100),
      },
      200,
      requestId,
      request.headers,
      'minify_json'
    )
  } catch (error) {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'minify_json')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
