import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com'

export async function GET() {
  const content = `# JSON Tree by Platphorm News - Full LLM Documentation

> Complete documentation for AI/LLM integration with JSON Tree
> Version: 0.0.1

## Overview

JSON Tree is a comprehensive JSON visualization and manipulation tool designed for developers and AI agents. It provides both a web interface and programmatic APIs for working with JSON data.

## Website
${BASE_URL}

## Capabilities

### Web Interface Features
- **Tree View**: Hierarchical visualization with collapsible nodes
- **Graph View**: Network diagram visualization with zoom/pan
- **Raw View**: Syntax-highlighted JSON text
- **Search**: Real-time search across keys and values
- **Format/Minify**: One-click JSON formatting and compression
- **Statistics**: Node counts, depth analysis, type distribution
- **Theme Support**: Light and dark mode

### API Features
- RESTful API with JSON responses
- Rate limiting (100 req/min per IP)
- CORS enabled for browser usage
- Request ID tracking
- OpenAPI 3.1 specification

## REST API Documentation

Base URL: ${BASE_URL}/api/v1

### Endpoints

#### Health Check
\`\`\`
GET /api/health
\`\`\`
Returns server health status and version.

#### Parse JSON
\`\`\`
POST /api/v1/parse
Content-Type: application/json

{
  "json": "{\\"name\\": \\"test\\"}",
  "options": {
    "includeStats": true
  }
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "tree": { ... },
    "stats": {
      "totalNodes": 2,
      "maxDepth": 1,
      "stringCount": 1,
      "objectCount": 1
    },
    "valid": true
  }
}
\`\`\`

#### Format JSON
\`\`\`
POST /api/v1/format
Content-Type: application/json

{
  "json": "{\\"a\\":1}",
  "indent": 2
}
\`\`\`

#### Minify JSON
\`\`\`
POST /api/v1/minify
Content-Type: application/json

{
  "json": "{ \\"a\\": 1 }"
}
\`\`\`

#### Validate JSON
\`\`\`
POST /api/v1/validate
Content-Type: application/json

{
  "json": "{\\"valid\\": true}"
}
\`\`\`

#### Diff JSON
\`\`\`
POST /api/v1/diff
Content-Type: application/json

{
  "source": "{\\"a\\": 1}",
  "target": "{\\"a\\": 2, \\"b\\": 3}"
}
\`\`\`

## MCP Server Integration

JSON Tree implements the Model Context Protocol (MCP) for seamless AI agent integration.

### Connection
\`\`\`
Endpoint: ${BASE_URL}/api/mcp
Protocol: MCP 2024-11-05
Transport: HTTP POST (JSON-RPC 2.0)
\`\`\`

### Available Tools

#### parse_json
Parse a JSON string into a tree structure with statistics.
\`\`\`json
{
  "name": "parse_json",
  "arguments": {
    "json": "{\\"key\\": \\"value\\"}",
    "includeStats": true
  }
}
\`\`\`

#### format_json
Format JSON with customizable indentation.
\`\`\`json
{
  "name": "format_json",
  "arguments": {
    "json": "{\\"a\\":1}",
    "indent": 2
  }
}
\`\`\`

#### minify_json
Remove all whitespace from JSON.
\`\`\`json
{
  "name": "minify_json",
  "arguments": {
    "json": "{ \\"a\\": 1 }"
  }
}
\`\`\`

#### validate_json
Check if a string is valid JSON.
\`\`\`json
{
  "name": "validate_json",
  "arguments": {
    "json": "{\\"test\\": true}"
  }
}
\`\`\`

#### diff_json
Compare two JSON objects and find differences.
\`\`\`json
{
  "name": "diff_json",
  "arguments": {
    "source": "{\\"a\\": 1}",
    "target": "{\\"a\\": 2}"
  }
}
\`\`\`

#### search_json
Search for keys or values within JSON.
\`\`\`json
{
  "name": "search_json",
  "arguments": {
    "json": "{\\"name\\": \\"John\\", \\"city\\": \\"NYC\\"}",
    "query": "John",
    "caseSensitive": false
  }
}
\`\`\`

#### get_json_stats
Get detailed statistics about JSON structure.
\`\`\`json
{
  "name": "get_json_stats",
  "arguments": {
    "json": "{\\"items\\": [1, 2, 3]}"
  }
}
\`\`\`

### Example MCP Request
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "format_json",
    "arguments": {
      "json": "{\\"name\\":\\"test\\"}",
      "indent": 2
    }
  }
}
\`\`\`

### Example MCP Response
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"formatted\\": \\"{\\\\n  \\\\\\"name\\\\\\": \\\\\\"test\\\\\\"\\\\n}\\", \\"length\\": 22}"
      }
    ]
  }
}
\`\`\`

## OpenAPI Specification

Full OpenAPI 3.1 specification available at:
${BASE_URL}/api/docs

## Data Types

### JsonNode
\`\`\`typescript
interface JsonNode {
  id: string
  key: string
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  path: string[]
  depth: number
  children?: JsonNode[]
}
\`\`\`

### TreeStats
\`\`\`typescript
interface TreeStats {
  totalNodes: number
  maxDepth: number
  stringCount: number
  numberCount: number
  booleanCount: number
  nullCount: number
  objectCount: number
  arrayCount: number
}
\`\`\`

## Error Handling

All API errors return a consistent format:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid",
    "version": "1.0.0"
  }
}
\`\`\`

HTTP Status Codes:
- 200: Success
- 400: Bad Request (invalid JSON)
- 429: Rate Limit Exceeded
- 500: Internal Server Error

## Rate Limiting

- Limit: 100 requests per minute per IP
- Headers returned:
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Links

- Website: ${BASE_URL}
- API Docs: ${BASE_URL}/api/docs
- MCP Server: ${BASE_URL}/api/mcp
- Health Check: ${BASE_URL}/api/health
- RSS Feed: ${BASE_URL}/feed.xml
- Sitemap: ${BASE_URL}/sitemap.xml

## Support

Built by Platphorm News
Website: https://platphormnews.com
Email: support@platphormnews.com
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
