import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST as parsePost } from '../app/api/v1/parse/route'
import { POST as schemaValidatePost } from '../app/api/v1/schema/validate/route'
import { GET as schemasGet } from '../app/api/v1/schemas/route'
import { GET as llmsIndexGet } from '../app/llms-index.json/route'
import { GET as openapiGet } from '../app/openapi.json/route'
import { POST as mcpPost } from '../app/api/mcp/route'
import { buildLlmsTxt, getPublicSitemapRoutes } from '../lib/discovery'

function jsonRequest(path: string, body: unknown) {
  return new Request(`https://json.platphormnews.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Phase 1 JSON API contract', () => {
  it('parses JSON with ok envelope and trace metadata', async () => {
    const response = await parsePost(jsonRequest('/api/v1/parse', { json: '{"a":1}' }))
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.data.valid).toBe(true)
    expect(data.data.stats.totalNodes).toBe(2)
    expect(data.meta.traceId).toHaveLength(32)
  })

  it('lists real schema files without embedding schema bodies in the index', async () => {
    const response = await schemasGet(new Request('https://json.platphormnews.com/api/v1/schemas') as never)
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.data.length).toBeGreaterThanOrEqual(6)
    expect(data.data.find((schema: { slug: string }) => schema.slug === 'realm')).toBeDefined()
    expect(data.data[0].schema).toBeUndefined()
  })

  it('validates JSON against a public schema with a real validator', async () => {
    const json = JSON.stringify({
      id: 100,
      universe_id: 1,
      slug: 'json-tree-schema-registry',
      name: 'JSON Tree + PlatPhorm Schema Registry',
      realm_type: 'utility-platform',
      primary_domain: 'json.platphormnews.com',
      canonical_url: 'https://json.platphormnews.com',
      environment: 'production',
      visibility: 'public',
      feature_tags: ['json'],
      environment_tags: ['production'],
      governance_tags: ['public'],
    })
    const response = await schemaValidatePost(jsonRequest('/api/v1/schema/validate', { json, schemaSlug: 'realm' }))
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.data.validator).toBe('ajv-draft-2020-12')
    expect(data.data.valid).toBe(true)
  })

  it('serves readable llms content and complete llms index', async () => {
    const text = buildLlmsTxt()
    expect(text.split('\n').length).toBeGreaterThan(20)
    expect(text).toContain('JSON Tree + PlatPhorm Schema Registry')
    expect(text).toContain('/schemas/json/core.schema.json')

    const response = await llmsIndexGet()
    const data = await response.json()
    expect(data.service).toBe('json')
    expect(data.authPolicy.keyName).toBe('PLATPHORM_API_KEY')
    expect(data.schemaPack.activeSchemaCount).toBeGreaterThanOrEqual(6)
  })

  it('documents json.platphormnews.com OpenAPI without generic API key placeholders', async () => {
    const response = await openapiGet()
    const data = await response.json()
    expect(data.servers[0].url).toBe('https://json.platphormnews.com')
    expect(JSON.stringify(data)).not.toContain('your_api_key')
    expect(JSON.stringify(data)).toContain('PLATPHORM_API_KEY')
  })

  it('handles MCP initialize, tools/list, and a real format_json tool call', async () => {
    const initResponse = await mcpPost(jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 1, method: 'initialize' }))
    expect((await initResponse.json()).result.serverInfo.name).toContain('json-tree')

    const toolsResponse = await mcpPost(jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 2, method: 'tools/list' }))
    const tools = await toolsResponse.json()
    expect(tools.result.tools.map((tool: { name: string }) => tool.name)).toContain('validate_against_schema')
    expect(tools.result.tools.map((tool: { name: string }) => tool.name)).toContain('fetch_json_url')

    const callResponse = await mcpPost(jsonRequest('/api/mcp', {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'format_json', arguments: { json: '{"a":1}' } },
    }))
    const call = await callResponse.json()
    expect(call.result.content[0].text).toContain('"formatted"')
  })

  it('executes a trusted JSON URL handoff through MCP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true,"data":{"workflows":[]}}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })))

    const response = await mcpPost(jsonRequest('/api/mcp', {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'fetch_json_url',
        arguments: { url: 'https://trace.platphormnews.com/api/v1/workflows' },
      },
    }))
    const body = await response.json()
    const result = JSON.parse(body.result.content[0].text)

    expect(result.status).toBe('available')
    expect(result.viewerUrl).toContain('https://json.platphormnews.com/')
    expect(result.json.data.workflows).toEqual([])
  })

  it('builds sitemap routes from implemented public-safe routes only', () => {
    const routes = getPublicSitemapRoutes()
    expect(routes).toContain('/')
    expect(routes).toContain('/faq')
    expect(routes).toContain('/schemas/json/core.schema.json')
    expect(routes).not.toContain('/api/cron/refresh')
    expect(routes.every((route) => !route.includes('{'))).toBe(true)
  })
})
