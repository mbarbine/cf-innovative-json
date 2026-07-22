import { NextRequest } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  createOptionsResponse,
  checkRateLimit, 
  getClientIP,
  validateJsonString,
  formatJsonString
} from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'format_json')
  }

  try {
    const body = await request.json()
    const { json, indent = 2 } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'format_json')
    }

    // Validate indent
    const indentNum = Math.min(Math.max(0, Number(indent)), 8)

    // Validate JSON first
    const validation = validateJsonString(json)
    if (!validation.valid) {
      return apiError(`Invalid JSON: ${validation.error}`, 400, requestId, 'INVALID_JSON', { line: validation.line, column: validation.column }, request.headers, 'format_json')
    }

    // Format
    const formatted = formatJsonString(json, indentNum)

    return apiResponse(
      {
        formatted,
        length: formatted.length,
        originalLength: json.length,
      },
      200,
      requestId,
      request.headers,
      'format_json'
    )
  } catch (error) {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'format_json')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
