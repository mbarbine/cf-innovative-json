import { NextRequest } from 'next/server'
import { apiResponse, apiError, createOptionsResponse, generateRequestId } from '@/lib/api-utils'
import { fetchTrustedJson, TrustedFetchError } from '@/lib/trusted-fetch'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const body = await request.json() as Record<string, unknown>
    const { url } = body

    if (!url || typeof url !== 'string') {
      return apiError('URL is required', 400, requestId, 'URL_REQUIRED', undefined, request.headers, 'fetch_json_url')
    }

    const result = await fetchTrustedJson(url, {
      signal: AbortSignal.timeout(10_000),
      requestHeaders: request.headers,
    })

    return apiResponse({
      json: result.text,
      url: result.finalUrl,
      size: result.size,
      contentType: result.contentType,
      redirects: result.redirects,
    }, 200, requestId, request.headers, 'fetch_json_url')
  } catch (error) {
    if (error instanceof TrustedFetchError) {
      return apiError(error.message, error.status, requestId, error.code, undefined, request.headers, 'fetch_json_url')
    }
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return apiError('Request timed out', 504, requestId, 'FETCH_TIMEOUT', undefined, request.headers, 'fetch_json_url')
    }
    return apiError('Failed to fetch URL', 500, requestId, 'FETCH_ERROR', undefined, request.headers, 'fetch_json_url')
  }
}

export async function OPTIONS() {
  return createOptionsResponse()
}
