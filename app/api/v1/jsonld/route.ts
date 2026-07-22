import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getJsonLdArtifacts } from '@/lib/schema-registry'

export async function GET(request: NextRequest) {
  return apiResponse(getJsonLdArtifacts(), 200, request.headers.get('x-request-id') || undefined, request.headers, 'jsonld_artifacts')
}

export async function OPTIONS() {
  return createOptionsResponse()
}
