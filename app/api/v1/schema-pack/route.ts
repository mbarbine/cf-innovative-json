import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getSchemaPack } from '@/lib/schema-registry'

export async function GET(request: NextRequest) {
  return apiResponse(getSchemaPack(), 200, request.headers.get('x-request-id') || undefined, request.headers, 'schema_pack')
}

export async function OPTIONS() {
  return createOptionsResponse()
}
