import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { listSchemas } from '@/lib/schema-registry'

export async function GET(request: NextRequest) {
  return apiResponse(
    listSchemas().map(({ schema, ...record }) => record),
    200,
    request.headers.get('x-request-id') || undefined,
    request.headers,
    'list_schemas',
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
