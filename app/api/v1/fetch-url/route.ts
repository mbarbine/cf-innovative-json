import { NextRequest } from 'next/server'
import { apiResponse, apiError, createOptionsResponse, generateRequestId } from '@/lib/api-utils'
import { fetchTrustedJsonUrl, RemoteJsonError } from '@/lib/remote-json'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return apiError('URL is required', 400, requestId, 'URL_REQUIRED', undefined, request.headers, 'fetch_json_url')
    }
    
    const result = await fetchTrustedJsonUrl(url)

    return apiResponse({
      json: result.json,
      url: result.sourceUrl,
      viewerUrl: result.viewerUrl,
      size: result.size,
      stats: result.stats,
      contentType: result.contentType,
    }, 200, requestId, request.headers, 'fetch_json_url')
  } catch (error) {
    if (error instanceof RemoteJsonError) {
      return apiError(error.message, error.status, requestId, error.code, error.details, request.headers, 'fetch_json_url')
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
