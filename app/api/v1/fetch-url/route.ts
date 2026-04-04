import { NextRequest } from 'next/server'
import { apiResponse, apiError, generateRequestId } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return apiError('URL is required', 400, requestId)
    }
    
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return apiError('Invalid URL format', 400, requestId)
    }
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return apiError('Only HTTP and HTTPS URLs are supported', 400, requestId)
    }
    
    // SSRF Protection: Block local, loopback, and private IP addresses
    const hostname = parsedUrl.hostname.toLowerCase()

    // Check for localhost/loopback
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname === '[::]'
    ) {
      return apiError('Access to local network resources is forbidden', 403, requestId)
    }

    // Check for private IP addresses (IPv4)
    const isPrivateIP = (ip: string) => {
      const parts = ip.split('.').map(p => parseInt(p, 10))
      if (parts.length !== 4 || parts.some(isNaN)) return false

      return (
        parts[0] === 10 || // 10.0.0.0/8
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
        (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
        (parts[0] === 169 && parts[1] === 254) // 169.254.0.0/16 (Link-local)
      )
    }

    if (isPrivateIP(hostname)) {
      return apiError('Access to private network resources is forbidden', 403, requestId)
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
      return apiError(`Failed to fetch URL: ${response.status} ${response.statusText}`, 502, requestId)
    }
    
    const text = await response.text()
    
    // Validate it's valid JSON
    try {
      JSON.parse(text)
    } catch {
      return apiError('URL does not return valid JSON', 422, requestId)
    }
    
    // Limit response size (5MB max)
    if (text.length > 5 * 1024 * 1024) {
      return apiError('JSON response is too large (max 5MB)', 413, requestId)
    }
    
    return apiResponse({ 
      json: text,
      url: url,
      size: text.length,
      contentType: response.headers.get('content-type')
    }, 200, requestId)
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return apiError('Request timed out', 504, requestId)
    }
    
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch URL',
      500,
      requestId
    )
  }
}
