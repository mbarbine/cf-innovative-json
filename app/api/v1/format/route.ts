import { NextRequest, NextResponse } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  corsHeaders, 
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
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId)
  }

  try {
    const body = await request.json()
    const { json, indent = 2 } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId)
    }

    // Validate indent
    const indentNum = Math.min(Math.max(0, Number(indent)), 8)

    // Validate JSON first
    const validation = validateJsonString(json)
    if (!validation.valid) {
      return apiError(`Invalid JSON: ${validation.error}`, 400, requestId)
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
      requestId
    )
  } catch (error) {
    console.error('Format error:', error)
    return apiError('Internal server error', 500, requestId)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
