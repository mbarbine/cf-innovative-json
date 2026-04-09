const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docs.platphormnews.com'

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'PlatPhorm Schema Registry API',
    description: 'The API reference for the PlatPhorm Universal Schema Pack contracts',
    version: '1.0.0',
    contact: {
      name: 'PlatPhorm Team',
      url: BASE_URL,
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: BASE_URL,
      description: 'Production Server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development Server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Health Check',
        description: 'Check realm health and capability exposure',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Realm is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'active' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string' },
                    uptime: { type: 'number', example: 12345 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/.well-known/platphorm.json': {
      get: {
        operationId: 'getManifest',
        summary: 'Realm Manifest',
        description: 'Discover the realm profile and capabilities',
        tags: ['Discovery'],
        responses: {
          '200': {
            description: 'Realm Manifest Data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    realm: {
                      type: 'object',
                      properties: {
                        slug: { type: 'string' },
                        realm_type: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/mcp': {
      get: {
        operationId: 'getMcpInfo',
        summary: 'MCP Server Information',
        description: 'Discovery route for MCP capabilities',
        tags: ['Agents'],
        responses: {
          '200': {
            description: 'MCP Server Capabilities'
          }
        }
      },
      post: {
        operationId: 'mcpCall',
        summary: 'Execute MCP JSON-RPC',
        description: 'Execute MCP methods (e.g. tools/call, tools/list)',
        tags: ['Agents'],
        responses: {
          '200': {
            description: 'MCP Response'
          }
        }
      }
    },
    '/v0/universes': {
      get: {
        operationId: 'listUniverses',
        summary: 'List Universes',
        description: 'Retrieve all universes in the network',
        tags: ['Network'],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/v0/realms': {
      get: {
        operationId: 'listRealms',
        summary: 'List Realms',
        description: 'Retrieve all realms in the network',
        tags: ['Network'],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/v0/realm/{id}/items': {
      get: {
        operationId: 'listRealmItems',
        summary: 'List Realm Items',
        description: 'Get all baseItems and typed extensions within a realm',
        tags: ['Content'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/v0/item/{id}': {
      get: {
        operationId: 'getItem',
        summary: 'Get Item',
        description: 'Retrieve a specific baseItem by FQID',
        tags: ['Content'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/v0/search': {
      get: {
        operationId: 'searchItems',
        summary: 'Search Network',
        description: 'Semantic or full-text search across items',
        tags: ['Content'],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/api/v1/fetch-url': {
      post: {
        operationId: 'fetchUrl',
        summary: 'Fetch URL',
        description: 'Fetches the JSON content from the provided URL. Note: Includes Server-Side Request Forgery (SSRF) protection. Requests to localhost, private IP ranges (e.g., 10.x.x.x, 192.168.x.x), and metadata endpoints (169.254.169.254) are explicitly blocked.',
        tags: ['Utility'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://jsonplaceholder.typicode.com/todos/1' }
                },
                required: ['url']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Invalid request or URL format' },
          '403': { description: 'Access to local or private networks is restricted (SSRF Protection)' },
          '422': { description: 'URL does not return valid JSON' },
          '500': { description: 'Server error during fetch' }
        }
      }
    }
  },
  components: {
    schemas: {}
  }
}
