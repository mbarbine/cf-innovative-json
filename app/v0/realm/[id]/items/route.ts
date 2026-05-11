import { NextRequest } from 'next/server'
import { apiResponse, createOptionsResponse } from '@/lib/api-utils'
import { getUniverseRegistry } from '@/lib/schema-registry'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const registry = getUniverseRegistry()
  const realm = registry.realms.find((item) => item.id === id || item.slug === id)
  const items = realm ? registry.items.filter((item) => item.realmId === realm.id) : []

  return apiResponse(
    {
      realm: realm || null,
      items,
      status: realm ? 'active' : 'degraded',
      message: realm ? 'Public schema registry realm items.' : 'Realm not found in the public static registry.',
    },
    200,
    request.headers.get('x-request-id') || undefined,
    request.headers,
    'v0_realm_items',
  )
}

export async function OPTIONS() {
  return createOptionsResponse()
}
