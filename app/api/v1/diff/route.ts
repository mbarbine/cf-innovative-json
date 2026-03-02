import { NextRequest, NextResponse } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  corsHeaders, 
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
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId)
  }

  try {
    const body = await request.json()
    const { source, target } = body

    if (!source || typeof source !== 'string') {
      return apiError('Missing or invalid "source" field. Expected a string.', 400, requestId)
    }

    if (!target || typeof target !== 'string') {
      return apiError('Missing or invalid "target" field. Expected a string.', 400, requestId)
    }

    // Validate both JSON strings
    const sourceValidation = validateJsonString(source)
    if (!sourceValidation.valid) {
      return apiError(`Invalid source JSON: ${sourceValidation.error}`, 400, requestId)
    }

    const targetValidation = validateJsonString(target)
    if (!targetValidation.valid) {
      return apiError(`Invalid target JSON: ${targetValidation.error}`, 400, requestId)
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
      requestId
    )
  } catch (error) {
    console.error('Diff error:', error)
    return apiError('Internal server error', 500, requestId)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
