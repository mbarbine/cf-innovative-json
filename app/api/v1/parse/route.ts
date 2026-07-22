import { NextRequest } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  createOptionsResponse,
  checkRateLimit, 
  getClientIP,
  validateJsonString
} from '@/lib/api-utils'
import { parseJsonToTree, calculateStats } from '@/lib/json-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'parse_json')
  }

  try {
    const body = await request.json() as { json?: unknown; options?: { includeStats?: boolean } }
    const { json, options = {} } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId, 'INVALID_JSON_FIELD', undefined, request.headers, 'parse_json')
    }

    // Validate JSON
    const validation = validateJsonString(json)
    if (!validation.valid) {
      return apiError(`Invalid JSON: ${validation.error}`, 400, requestId, 'INVALID_JSON', { line: validation.line, column: validation.column }, request.headers, 'parse_json')
    }

    // Parse to tree
    const tree = parseJsonToTree(validation.parsed)
    
    // Calculate stats if requested
    const stats = options.includeStats !== false ? calculateStats(tree) : undefined

    return apiResponse(
      {
        tree,
        stats,
        valid: true,
      },
      200,
      requestId,
      request.headers,
      'parse_json'
    )
  } catch (error) {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'parse_json')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
