import { NextRequest, NextResponse } from 'next/server'
import { 
  apiResponse, 
  apiError, 
  corsHeaders, 
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
    return apiError('Rate limit exceeded. Please try again later.', 429, requestId)
  }

  try {
    const body = await request.json()
    const { json } = body

    if (!json || typeof json !== 'string') {
      return apiError('Missing or invalid "json" field. Expected a string.', 400, requestId)
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
        requestId
      )
    } else {
      return apiResponse(
        {
          valid: false,
          error: validation.error,
        },
        200,
        requestId
      )
    }
  } catch (error) {
    console.error('Validate error:', error)
    return apiError('Internal server error', 500, requestId)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
