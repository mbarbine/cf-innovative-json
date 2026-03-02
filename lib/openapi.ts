import type { OpenApiSpec } from './types'

export const openApiSpec: OpenApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'JSON Tree API',
    description: `
# JSON Tree API

A comprehensive REST API for JSON parsing, validation, formatting, and visualization.

## Features

- **Parse** - Convert JSON strings to tree structures with statistics
- **Format** - Pretty-print JSON with customizable indentation  
- **Minify** - Compress JSON by removing whitespace
- **Validate** - Check if a string is valid JSON
- **Diff** - Compare two JSON objects and find differences
- **Query** - Extract values using JSONPath expressions

## Rate Limiting

API requests are limited to 100 requests per minute per IP address.

## MCP Server

This API also supports the Model Context Protocol (MCP) for AI agent integration.
See \`/api/mcp\` for MCP server endpoints.
    `.trim(),
    version: '1.0.0',
    contact: {
      name: 'JSON Tree Support',
      url: 'https://json-tree.vercel.app',
      email: 'support@json-tree.vercel.app',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://json-tree.vercel.app',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Health Check',
        description: 'Check if the API is running and healthy',
        tags: ['System'],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        version: { type: 'string', example: '1.0.0' },
                        uptime: { type: 'number', example: 12345 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/parse': {
      post: {
        operationId: 'parseJson',
        summary: 'Parse JSON to Tree',
        description: 'Parse a JSON string into a tree structure with statistics',
        tags: ['JSON Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['json'],
                properties: {
                  json: {
                    type: 'string',
                    description: 'JSON string to parse',
                    example: '{"name": "test", "items": [1, 2, 3]}',
                  },
                  options: {
                    type: 'object',
                    properties: {
                      maxDepth: {
                        type: 'integer',
                        description: 'Maximum depth to parse',
                        default: 100,
                      },
                      includeStats: {
                        type: 'boolean',
                        description: 'Include statistics in response',
                        default: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully parsed JSON',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ParseResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid JSON',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/format': {
      post: {
        operationId: 'formatJson',
        summary: 'Format JSON',
        description: 'Pretty-print JSON with customizable indentation',
        tags: ['JSON Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['json'],
                properties: {
                  json: {
                    type: 'string',
                    description: 'JSON string to format',
                  },
                  indent: {
                    type: 'integer',
                    description: 'Number of spaces for indentation',
                    default: 2,
                    minimum: 0,
                    maximum: 8,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully formatted JSON',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        formatted: { type: 'string' },
                        length: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/minify': {
      post: {
        operationId: 'minifyJson',
        summary: 'Minify JSON',
        description: 'Remove all whitespace from JSON',
        tags: ['JSON Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['json'],
                properties: {
                  json: {
                    type: 'string',
                    description: 'JSON string to minify',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully minified JSON',
          },
        },
      },
    },
    '/api/v1/validate': {
      post: {
        operationId: 'validateJson',
        summary: 'Validate JSON',
        description: 'Check if a string is valid JSON',
        tags: ['JSON Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['json'],
                properties: {
                  json: {
                    type: 'string',
                    description: 'JSON string to validate',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Validation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        valid: { type: 'boolean' },
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/diff': {
      post: {
        operationId: 'diffJson',
        summary: 'Diff JSON',
        description: 'Compare two JSON objects and find differences',
        tags: ['JSON Operations'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source', 'target'],
                properties: {
                  source: {
                    type: 'string',
                    description: 'Source JSON string',
                  },
                  target: {
                    type: 'string',
                    description: 'Target JSON string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Diff result',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ParseResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              tree: { $ref: '#/components/schemas/JsonNode' },
              stats: { $ref: '#/components/schemas/TreeStats' },
              valid: { type: 'boolean' },
            },
          },
          meta: { $ref: '#/components/schemas/ResponseMeta' },
        },
      },
      JsonNode: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          value: {},
          type: {
            type: 'string',
            enum: ['string', 'number', 'boolean', 'null', 'object', 'array'],
          },
          path: {
            type: 'array',
            items: { type: 'string' },
          },
          depth: { type: 'integer' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/JsonNode' },
          },
        },
      },
      TreeStats: {
        type: 'object',
        properties: {
          totalNodes: { type: 'integer' },
          maxDepth: { type: 'integer' },
          stringCount: { type: 'integer' },
          numberCount: { type: 'integer' },
          booleanCount: { type: 'integer' },
          nullCount: { type: 'integer' },
          objectCount: { type: 'integer' },
          arrayCount: { type: 'integer' },
        },
      },
      ResponseMeta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string', format: 'uuid' },
          version: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          meta: { $ref: '#/components/schemas/ResponseMeta' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Optional API key for increased rate limits',
      },
    },
  },
}
