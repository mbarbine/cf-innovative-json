import { API_ROUTES, APP_VERSION, BASE_URL, PRODUCT_NAME, SCHEMA_FILES } from './platform'

const okEnvelope = (dataSchema: Record<string, unknown>) => ({
  type: 'object',
  required: ['ok', 'data', 'meta'],
  properties: {
    ok: { const: true },
    data: dataSchema,
    meta: { $ref: '#/components/schemas/ResponseMeta' },
  },
})

const errorEnvelope = {
  type: 'object',
  required: ['ok', 'error', 'meta'],
  properties: {
    ok: { const: false },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
      },
    },
    meta: { $ref: '#/components/schemas/ResponseMeta' },
  },
}

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: `${PRODUCT_NAME} API`,
    description:
      'Public-safe JSON parse, format, minify, validation, schema registry, JSON-LD, v0 registry, and MCP discovery API for json.platphormnews.com.',
    version: APP_VERSION,
    contact: {
      name: 'PlatPhormNews',
      url: 'https://platphormnews.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: BASE_URL,
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'JSON Tools', description: 'Public-safe JSON utility operations.' },
    { name: 'Schema Registry', description: 'Public PlatPhorm schema pack and schema validation.' },
    { name: 'Discovery', description: 'Health, OpenAPI, llms, RSS, sitemap, trust, and well-known files.' },
    { name: 'MCP', description: 'JSON-RPC 2.0 MCP endpoint and metadata.' },
    { name: 'V0 Registry', description: 'Public universe, realm, and item views backed by schema registry state.' },
  ],
  paths: {
    '/api/health': healthPath(),
    '/api/v1/health': healthPath(),
    '/api/docs': {
      get: {
        tags: ['Discovery'],
        summary: 'OpenAPI JSON',
        responses: {
          '200': { description: 'OpenAPI 3.1 JSON document' },
        },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['Discovery'],
        summary: 'OpenAPI JSON',
        responses: { '200': { description: 'OpenAPI 3.1 JSON document' } },
      },
    },
    '/openapi.yaml': {
      get: {
        tags: ['Discovery'],
        summary: 'OpenAPI YAML',
        responses: { '200': { description: 'OpenAPI 3.1 YAML document' } },
      },
    },
    '/api/v1/parse': postJsonTool('Parse JSON into tree nodes and stats.', okEnvelope({
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        tree: { type: 'object' },
        stats: { $ref: '#/components/schemas/JsonStats' },
      },
    })),
    '/api/v1/format': postJsonTool('Format valid JSON.', okEnvelope({
      type: 'object',
      properties: {
        formatted: { type: 'string' },
        length: { type: 'integer' },
        originalLength: { type: 'integer' },
      },
    })),
    '/api/v1/minify': postJsonTool('Minify valid JSON.', okEnvelope({
      type: 'object',
      properties: {
        minified: { type: 'string' },
        length: { type: 'integer' },
        originalLength: { type: 'integer' },
        saved: { type: 'integer' },
        savedPercent: { type: 'integer' },
      },
    })),
    '/api/v1/validate': postJsonTool('Validate JSON syntax and return stats when valid.', okEnvelope({
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        stats: { $ref: '#/components/schemas/JsonStats' },
        error: { type: 'string' },
        line: { type: 'integer' },
        column: { type: 'integer' },
      },
    })),
    '/api/v1/stats': postJsonTool('Calculate JSON statistics.', okEnvelope({ $ref: '#/components/schemas/JsonStats' })),
    '/api/v1/schema/validate': {
      post: {
        tags: ['Schema Registry'],
        summary: 'Validate JSON against a public schema',
        description: 'Public-safe schema validation against bundled public schema registry files.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['json', 'schemaSlug'],
                properties: {
                  json: { type: 'string' },
                  schemaSlug: { type: 'string', enum: SCHEMA_FILES.map((schema) => schema.slug) },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Validation result', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } },
          '400': { description: 'Invalid request', content: { 'application/json': { schema: errorEnvelope } } },
        },
      },
    },
    '/api/v1/schemas': {
      get: {
        tags: ['Schema Registry'],
        summary: 'List public schemas',
        responses: { '200': { description: 'Schema records', content: { 'application/json': { schema: okEnvelope({ type: 'array', items: { type: 'object' } }) } } } },
      },
    },
    '/api/v1/schemas/{slug}': {
      get: {
        tags: ['Schema Registry'],
        summary: 'Get public schema',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Schema record', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } },
          '404': { description: 'Schema not found', content: { 'application/json': { schema: errorEnvelope } } },
        },
      },
    },
    '/api/v1/schema-pack': {
      get: {
        tags: ['Schema Registry'],
        summary: 'Get public schema pack metadata',
        responses: { '200': { description: 'Schema pack', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } } },
      },
    },
    '/api/v1/jsonld': {
      get: {
        tags: ['Schema Registry'],
        summary: 'Get JSON-LD artifacts',
        responses: { '200': { description: 'JSON-LD artifacts', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } } },
      },
    },
    '/api/v1/jsonld/validate': postJsonTool('Validate JSON-LD structure locally.', okEnvelope({ type: 'object' })),
    '/api/mcp': {
      get: {
        tags: ['MCP'],
        summary: 'Read MCP metadata',
        responses: { '200': { description: 'MCP metadata' } },
      },
      post: {
        tags: ['MCP'],
        summary: 'Execute JSON-RPC 2.0 MCP request',
        description: 'Public-safe read-only introspection and JSON/schema utility tools. Future protected tool calls use PLATPHORM_API_KEY when enforcement is enabled.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { jsonrpc: { const: '2.0' }, id: {}, method: { type: 'string' }, params: { type: 'object' } } },
            },
          },
        },
        responses: { '200': { description: 'JSON-RPC 2.0 response' } },
      },
    },
    '/v0/universes': getV0Path('List public schema registry universes.'),
    '/v0/realms': getV0Path('List public schema registry realms.'),
    '/v0/realm/{id}/items': {
      get: {
        tags: ['V0 Registry'],
        summary: 'List realm items',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Realm schema items', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } } },
      },
    },
  },
  components: {
    securitySchemes: {
      PlatPhormApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-PlatPhorm-API-Key',
        description: 'Future protected-action auth. Public-safe Phase 1 flows do not require this key by default.',
      },
      PlatPhormBearer: {
        type: 'http',
        scheme: 'bearer',
        description: 'Future protected-action auth using Authorization: Bearer $PLATPHORM_API_KEY.',
      },
    },
    schemas: {
      ResponseMeta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
          version: { type: 'string' },
          traceId: { type: 'string' },
          spanId: { type: 'string' },
          traceUrl: { type: 'string', format: 'uri' },
        },
      },
      JsonStats: {
        type: 'object',
        properties: {
          totalNodes: { type: 'integer' },
          maxDepth: { type: 'integer' },
          types: { type: 'object', additionalProperties: { type: 'integer' } },
        },
      },
    },
  },
  'x-platphorm': {
    service: 'json',
    product: PRODUCT_NAME,
    authPolicy: 'Public-safe by default. Future protected actions use PLATPHORM_API_KEY only.',
    routeCount: API_ROUTES.length,
  },
}

function healthPath() {
  return {
    get: {
      tags: ['Discovery'],
      summary: 'Health summary',
      responses: {
        '200': {
          description: 'Health response',
          content: {
            'application/json': {
              schema: okEnvelope({ type: 'object' }),
            },
          },
        },
      },
    },
  }
}

function postJsonTool(summary: string, responseSchema: Record<string, unknown>) {
  return {
    post: {
      tags: ['JSON Tools'],
      summary,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['json'],
              properties: {
                json: { type: 'string' },
                indent: { type: 'integer', minimum: 0, maximum: 8 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'JSON tool result', content: { 'application/json': { schema: responseSchema } } },
        '400': { description: 'Invalid request', content: { 'application/json': { schema: errorEnvelope } } },
        '429': { description: 'Rate limited', content: { 'application/json': { schema: errorEnvelope } } },
      },
    },
  }
}

function getV0Path(summary: string) {
  return {
    get: {
      tags: ['V0 Registry'],
      summary,
      responses: { '200': { description: 'V0 registry result', content: { 'application/json': { schema: okEnvelope({ type: 'object' }) } } } },
    },
  }
}
