import { NextRequest } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  createOptionsResponse,
  checkRateLimit, 
  getClientIP,
  validateJsonString
} from '@/lib/api-utils'
import { diffJson } from '@/lib/json-utils'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId, 'RATE_LIMITED', undefined, request.headers, 'diff_json')
  }

  try {
    const body = await request.json()
    const { source, target } = body

    if (!source || typeof source !== 'string') {
      return apiError('Missing or invalid "source" field. Expected a string.', 400, requestId, 'INVALID_SOURCE_FIELD', undefined, request.headers, 'diff_json')
    }

    if (!target || typeof target !== 'string') {
      return apiError('Missing or invalid "target" field. Expected a string.', 400, requestId, 'INVALID_TARGET_FIELD', undefined, request.headers, 'diff_json')
    }

    // Validate both JSON strings
    const sourceValidation = validateJsonString(source)
    if (!sourceValidation.valid) {
      return apiError(`Invalid source JSON: ${sourceValidation.error}`, 400, requestId, 'INVALID_SOURCE_JSON', { line: sourceValidation.line, column: sourceValidation.column }, request.headers, 'diff_json')
    }

    const targetValidation = validateJsonString(target)
    if (!targetValidation.valid) {
      return apiError(`Invalid target JSON: ${targetValidation.error}`, 400, requestId, 'INVALID_TARGET_JSON', { line: targetValidation.line, column: targetValidation.column }, request.headers, 'diff_json')
    }

    // Calculate diff
    const diff = diffJson(source, target)
    
    const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0

    return apiResponse(
      {
        diff,
        hasChanges,
        summary: {
          added: diff.added.length,
          removed: diff.removed.length,
          modified: diff.modified.length,
        },
      },
      200,
      requestId,
      request.headers,
      'diff_json'
    )
  } catch (error) {
    return apiError('Internal server error', 500, requestId, 'INTERNAL_ERROR', undefined, request.headers, 'diff_json')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
