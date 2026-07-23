import { calculateJsonStats, formatJsonString, minifyJsonString, validateJsonString } from './api-utils'
import { buildLlmsTxt, buildTrustPolicy, getDiscoveryCompliance, getRouteCompliance } from './discovery'
import { openApiSpec } from './openapi'
import { getJsonLdArtifacts, getSchema, getSchemaPack, getUniverseRegistry, listSchemas, validateJsonAgainstSchema, validateJsonLd } from './schema-registry'
import { createTraceContext } from './trace'
import { APP_VERSION, PRODUCT_NAME } from './platform'
import { fetchTrustedJsonUrl, MCP_REMOTE_JSON_MAX_BYTES } from './remote-json'

type JsonRpcId = string | number | null
type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: JsonRpcId
  method: string
  params?: Record<string, unknown>
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: JsonRpcId
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

const tool = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  name,
  description,
  inputSchema: {
    type: 'object',
    properties,
    required,
  },
})

export const MCP_TOOLS = [
  tool('fetch_json_url', 'Fetch and inspect public JSON from the PlatPhorm network or an explicitly approved demo origin and return its graph-view handoff URL.', { url: { type: 'string', format: 'uri' } }, ['url']),
  tool('parse_json', 'Parse JSON and return validity, parsed data, and stats.', { json: { type: 'string' } }, ['json']),
  tool('format_json', 'Format valid JSON with indentation.', { json: { type: 'string' }, indent: { type: 'number', default: 2 } }, ['json']),
  tool('minify_json', 'Minify valid JSON.', { json: { type: 'string' } }, ['json']),
  tool('validate_json', 'Validate JSON syntax.', { json: { type: 'string' } }, ['json']),
  tool('get_json_stats', 'Calculate JSON node and type statistics.', { json: { type: 'string' } }, ['json']),
  tool('validate_against_schema', 'Validate JSON against a public schema registry file.', { json: { type: 'string' }, schemaSlug: { type: 'string' } }, ['json', 'schemaSlug']),
  tool('list_schemas', 'List public schema registry records.'),
  tool('get_schema', 'Get one public schema registry record.', { slug: { type: 'string' } }, ['slug']),
  tool('get_schema_pack', 'Get public schema pack metadata.'),
  tool('validate_jsonld', 'Validate JSON-LD structure locally.', { json: { type: 'string' } }, ['json']),
  tool('network_get_universe', 'Get public JSON schema registry universe.', { id: { type: 'string' } }),
  tool('network_list_realms', 'List public JSON schema registry realms.'),
  tool('network_get_realm', 'Get public JSON schema registry realm.', { id: { type: 'string' } }),
  tool('network_get_trace', 'Return public trace lookup link for a trace id.', { traceId: { type: 'string' } }, ['traceId']),
  tool('network_get_request', 'Return degraded request lookup metadata unless protected backing storage is configured.', { requestId: { type: 'string' } }, ['requestId']),
  tool('network_get_provenance', 'Return public provenance for schema registry items.', { itemId: { type: 'string' } }, ['itemId']),
  tool('network_get_fingerprint', 'Return degraded fingerprint metadata unless backing integration is configured.', { fingerprintId: { type: 'string' } }, ['fingerprintId']),
  tool('network_get_agent_run', 'Return degraded agent-run metadata unless backing integration is configured.', { runId: { type: 'string' } }, ['runId']),
  tool('content_get_item', 'Get a public schema registry item.', { id: { type: 'string' } }, ['id']),
  tool('content_search', 'Search public schema titles and descriptions.', { query: { type: 'string' } }, ['query']),
  tool('get_health', 'Get public health summary.'),
  tool('get_info', 'Get service info.'),
  tool('get_route_compliance', 'Get route compliance summary.'),
  tool('get_discovery_compliance', 'Get discovery compliance summary.'),
  tool('create_docs_report', 'Future protected Docs report integration; returns degraded when unconfigured.'),
  tool('create_sheet_report', 'Future protected Sheets report integration; returns degraded when unconfigured.'),
  tool('create_deck_summary', 'Future protected Decks summary integration; returns degraded when unconfigured.'),
]

export const MCP_RESOURCES = [
  { uri: 'json://schemas', name: 'Public schema registry', mimeType: 'application/json' },
  { uri: 'json://schema/{slug}', name: 'Public schema by slug', mimeType: 'application/schema+json' },
  { uri: 'json://schema-pack', name: 'PlatPhorm universal schema pack', mimeType: 'application/json' },
  { uri: 'json://examples', name: 'Public JSON examples', mimeType: 'application/json' },
  { uri: 'json://universes', name: 'V0 universes', mimeType: 'application/json' },
  { uri: 'json://realms', name: 'V0 realms', mimeType: 'application/json' },
  { uri: 'json://realm/{id}/items', name: 'V0 realm items', mimeType: 'application/json' },
  { uri: 'json://openapi', name: 'OpenAPI document', mimeType: 'application/json' },
  { uri: 'json://llms', name: 'llms.txt', mimeType: 'text/plain' },
  { uri: 'json://trust-policy', name: 'Trust policy', mimeType: 'application/json' },
]

export const MCP_PROMPTS = [
  { name: 'explain_json', description: 'Explain the structure and important fields in JSON.' },
  { name: 'fix_invalid_json', description: 'Help repair invalid JSON from parser errors.' },
  { name: 'generate_json_schema', description: 'Draft a JSON Schema from a public-safe JSON sample.' },
  { name: 'validate_json_contract', description: 'Validate JSON against a named PlatPhorm schema contract.' },
  { name: 'summarize_json_tree', description: 'Summarize a JSON tree for human-machine handoff.' },
  { name: 'explain_schema', description: 'Explain a schema registry entry.' },
  { name: 'generate_jsonld', description: 'Draft JSON-LD hints from JSON.' },
  { name: 'create_schema_registry_entry', description: 'Prepare a schema registry entry for future protected review.' },
  { name: 'human_machine_json_handoff', description: 'Create a concise handoff summary for JSON and schema work.' },
]

async function executeTool(name: string, args: Record<string, unknown>, headers?: Headers): Promise<unknown> {
  const json = typeof args.json === 'string' ? args.json : ''
  const registry = getUniverseRegistry()

  switch (name) {
    case 'fetch_json_url': {
      const result = await fetchTrustedJsonUrl(String(args.url || ''), { maxBytes: MCP_REMOTE_JSON_MAX_BYTES })
      return {
        status: 'available',
        sourceUrl: result.sourceUrl,
        viewerUrl: result.viewerUrl,
        size: result.size,
        contentType: result.contentType,
        stats: result.stats,
        json: result.parsed,
      }
    }
    case 'parse_json': {
      const parsed = validateJsonString(json)
      return parsed.valid
        ? { valid: true, parsed: parsed.parsed, stats: calculateJsonStats(parsed.parsed) }
        : { valid: false, error: parsed.error, line: parsed.line, column: parsed.column }
    }
    case 'format_json':
      return { formatted: formatJsonString(json, Math.min(Math.max(Number(args.indent ?? 2), 0), 8)) }
    case 'minify_json':
      return { minified: minifyJsonString(json) }
    case 'validate_json': {
      const parsed = validateJsonString(json)
      return parsed.valid ? { valid: true, stats: calculateJsonStats(parsed.parsed) } : { valid: false, error: parsed.error, line: parsed.line, column: parsed.column }
    }
    case 'get_json_stats': {
      const parsed = validateJsonString(json)
      return parsed.valid ? calculateJsonStats(parsed.parsed) : { valid: false, error: parsed.error }
    }
    case 'validate_against_schema':
      return validateJsonAgainstSchema(json, String(args.schemaSlug || 'core'))
    case 'list_schemas':
      return listSchemas().map(({ schema, ...record }) => record)
    case 'get_schema':
      return getSchema(String(args.slug || '')) || degraded('schema_not_found', 'Schema was not found in the public registry.', headers)
    case 'get_schema_pack':
      return getSchemaPack()
    case 'validate_jsonld':
      return validateJsonLd(json)
    case 'network_get_universe':
      return args.id ? registry.universes.find((item) => item.id === args.id || item.slug === args.id) || registry.universes[0] : registry.universes[0]
    case 'network_list_realms':
      return { realms: registry.realms }
    case 'network_get_realm':
      return args.id ? registry.realms.find((item) => item.id === args.id || item.slug === args.id) || registry.realms[0] : registry.realms[0]
    case 'network_get_trace': {
      const traceId = String(args.traceId || '')
      return {
        status: traceId ? 'available_link' : 'degraded',
        traceId,
        traceUrl: traceId ? `https://trace.platphormnews.com/traces/${encodeURIComponent(traceId)}?source=json` : null,
        message: traceId ? 'Trace lookup is delegated to Trace.' : 'traceId is required.',
      }
    }
    case 'network_get_provenance':
    case 'content_get_item': {
      const id = String(args.itemId || args.id || '')
      return registry.items.find((item) => item.id === id || item.slug === id) || degraded('item_not_found', 'No public schema registry item matched the requested id.', headers)
    }
    case 'content_search': {
      const query = String(args.query || '').toLowerCase()
      return {
        query,
        items: registry.items.filter((item) => JSON.stringify(item).toLowerCase().includes(query)),
      }
    }
    case 'get_health':
      return { status: 'active', product: PRODUCT_NAME, routeCompliance: getRouteCompliance(), discoveryCompliance: getDiscoveryCompliance() }
    case 'get_info':
      return { product: PRODUCT_NAME, tools: MCP_TOOLS.map((item) => item.name), resources: MCP_RESOURCES.map((item) => item.uri), prompts: MCP_PROMPTS.map((item) => item.name) }
    case 'get_route_compliance':
      return getRouteCompliance()
    case 'get_discovery_compliance':
      return getDiscoveryCompliance()
    case 'network_get_request':
    case 'network_get_fingerprint':
    case 'network_get_agent_run':
    case 'create_docs_report':
    case 'create_sheet_report':
    case 'create_deck_summary':
      return degraded('integration_unconfigured', `${name} is a future protected cross-site integration and is not configured in Phase 1.`, headers)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

function degraded(code: string, message: string, headers?: Headers) {
  const trace = createTraceContext(headers, code)
  return {
    status: 'degraded',
    code,
    message,
    traceId: trace.traceId,
    traceUrl: trace.traceUrl,
  }
}

function contentResult(value: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  }
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  }
}

function promptMessages(name: string) {
  const prompt = MCP_PROMPTS.find((item) => item.name === name)
  if (!prompt) return null

  return {
    description: prompt.description,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `${prompt.description} Use only public-safe JSON content and do not expose secrets or PLATPHORM_API_KEY.`,
        },
      },
    ],
  }
}

function readResource(uri: string) {
  if (uri === 'json://schemas') return listSchemas().map(({ schema, ...record }) => record)
  if (uri.startsWith('json://schema/')) return getSchema(uri.replace('json://schema/', ''))
  if (uri === 'json://schema-pack') return getSchemaPack()
  if (uri === 'json://examples') return { examples: [{ name: 'schema registry manifest', sample: true, product: PRODUCT_NAME }] }
  if (uri === 'json://universes') return getUniverseRegistry().universes
  if (uri === 'json://realms') return getUniverseRegistry().realms
  if (uri.startsWith('json://realm/')) return getUniverseRegistry().items
  if (uri === 'json://openapi') return openApiSpec
  if (uri === 'json://llms') return buildLlmsTxt()
  if (uri === 'json://trust-policy') return buildTrustPolicy()
  return null
}

async function handleSingleRequest(body: JsonRpcRequest, headers?: Headers): Promise<JsonRpcResponse | null> {
  const id = body.id ?? null

  if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return jsonRpcError(id, -32600, 'Invalid JSON-RPC 2.0 request.')
  }

  switch (body.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: { listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: {
            name: 'json-tree-platphorm-schema-registry',
            version: APP_VERSION,
          },
        },
      }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } }
    case 'tools/call': {
      const params = body.params || {}
      const name = String(params.name || '')
      const args = typeof params.arguments === 'object' && params.arguments ? params.arguments as Record<string, unknown> : {}
      try {
        const result = await executeTool(name, args, headers)
        return { jsonrpc: '2.0', id, result: contentResult(result) }
      } catch (error) {
        return jsonRpcError(id, -32000, (error as Error).message)
      }
    }
    case 'resources/list':
      return { jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } }
    case 'resources/read': {
      const uri = String(body.params?.uri || '')
      const resource = readResource(uri)
      if (!resource) return jsonRpcError(id, -32004, `Resource not found: ${uri}`)
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: uri === 'json://llms' ? 'text/plain' : 'application/json',
              text: typeof resource === 'string' ? resource : JSON.stringify(resource, null, 2),
            },
          ],
        },
      }
    }
    case 'prompts/list':
      return { jsonrpc: '2.0', id, result: { prompts: MCP_PROMPTS } }
    case 'prompts/get': {
      const name = String(body.params?.name || '')
      const prompt = promptMessages(name)
      if (!prompt) return jsonRpcError(id, -32004, `Prompt not found: ${name}`)
      return { jsonrpc: '2.0', id, result: prompt }
    }
    case 'notifications/initialized':
      return null
    default:
      return jsonRpcError(id, -32601, `Method not found: ${body.method}`)
  }
}

export async function handleMcpRequest(body: unknown, headers?: Headers): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map((item) => handleSingleRequest(item as JsonRpcRequest, headers)))
    return responses.filter((item): item is JsonRpcResponse => Boolean(item))
  }

  return handleSingleRequest(body as JsonRpcRequest, headers)
}
