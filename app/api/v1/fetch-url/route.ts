import { NextRequest, NextResponse } from 'next/server'
import { createApiResponse, createErrorResponse, generateRequestId } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        createErrorResponse('URL is required', requestId),
        { status: 400 }
      )
    }
    
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        createErrorResponse('Invalid URL format', requestId),
        { status: 400 }
      )
    }
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        createErrorResponse('Only HTTP and HTTPS URLs are supported', requestId),
        { status: 400 }
      )
    }
    
    // Fetch the JSON from the URL
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'JSON-Tree/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      return NextResponse.json(
        createErrorResponse(`Failed to fetch URL: ${response.status} ${response.statusText}`, requestId),
        { status: 502 }
      )
    }
    
    const text = await response.text()
    
    // Validate it's valid JSON
    try {
      JSON.parse(text)
    } catch {
      return NextResponse.json(
        createErrorResponse('URL does not return valid JSON', requestId),
        { status: 422 }
      )
    }
    
    // Limit response size (5MB max)
    if (text.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        createErrorResponse('JSON response is too large (max 5MB)', requestId),
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      createApiResponse({ 
        json: text,
        url: url,
        size: text.length,
        contentType: response.headers.get('content-type')
      }, requestId)
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        createErrorResponse('Request timed out', requestId),
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch URL',
        requestId
      ),
      { status: 500 }
    )
  }
}
