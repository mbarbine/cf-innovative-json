import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getUniverseRegistry } from '@/lib/schema-registry'

export async function GET(request: NextRequest) {
  return apiResponse({ universes: getUniverseRegistry().universes }, 200, request.headers.get('x-request-id') || undefined, request.headers, 'v0_universes')
}

export async function OPTIONS() {
  return createOptionsResponse()
}
