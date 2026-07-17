import { NextRequest } from 'next/server'
import { apiResponse, apiError, generateRequestId, isSafeUrl } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return apiError('URL is required', 400, requestId, 'URL_REQUIRED', undefined, request.headers, 'fetch_json_url')
    }
    
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return apiError('Invalid URL format', 400, requestId, 'INVALID_URL', undefined, request.headers, 'fetch_json_url')
    }
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return apiError('Only HTTP and HTTPS URLs are supported', 400, requestId, 'UNSUPPORTED_PROTOCOL', undefined, request.headers, 'fetch_json_url')
    }

    if (!isTrustedPlatphormHost(parsedUrl.hostname)) {
      return apiError('Phase 1 server-side URL import is limited to trusted *.platphormnews.com hosts.', 403, requestId, 'UNTRUSTED_HOST', { host: parsedUrl.hostname }, request.headers, 'fetch_json_url')
    }

    // SSRF Protection: Ensure URL does not point to internal/private networks
    if (!isSafeUrl(url)) {
      return apiError('The provided URL is not allowed', 400, requestId)
    }
    
    // Fetch the JSON from the URL
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'JSON-Tree-PlatPhorm-Schema-Registry/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      return apiError(`Failed to fetch URL: ${response.status} ${response.statusText}`, 502, requestId, 'FETCH_FAILED', undefined, request.headers, 'fetch_json_url')
    }
    
    const text = await response.text()
    
    // Validate it's valid JSON
    try {
      JSON.parse(text)
    } catch {
      return apiError('URL does not return valid JSON', 422, requestId, 'FETCHED_INVALID_JSON', undefined, request.headers, 'fetch_json_url')
    }
    
    // Limit response size (5MB max)
    if (text.length > 5 * 1024 * 1024) {
      return apiError('JSON response is too large (max 5MB)', 413, requestId, 'FETCHED_JSON_TOO_LARGE', undefined, request.headers, 'fetch_json_url')
    }
    
    return apiResponse({ 
      json: text,
      url: url,
      size: text.length,
      contentType: response.headers.get('content-type')
    }, 200, requestId, request.headers, 'fetch_json_url')
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return apiError('Request timed out', 504, requestId, 'FETCH_TIMEOUT', undefined, request.headers, 'fetch_json_url')
    }
    
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch URL',
      500,
      requestId,
      'FETCH_ERROR',
      undefined,
      request.headers,
      'fetch_json_url'
    )
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
