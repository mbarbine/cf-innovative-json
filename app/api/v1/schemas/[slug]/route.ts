import { NextRequest } from 'next/server'
import { apiError, apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getSchema } from '@/lib/schema-registry'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params
  const schema = getSchema(slug)
  if (!schema) {
    return apiError('Schema not found.', 404, request.headers.get('x-request-id') || undefined, 'SCHEMA_NOT_FOUND', { slug }, request.headers, 'get_schema')
  }

  return apiResponse(schema, 200, request.headers.get('x-request-id') || undefined, request.headers, 'get_schema')
}

export async function OPTIONS() {
  return createOptionsResponse()
}
