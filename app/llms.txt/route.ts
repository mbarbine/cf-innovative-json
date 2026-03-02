import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json-tree.vercel.app'

export async function GET() {
  const content = `# JSON Tree

> A powerful JSON visualization and manipulation tool for developers

## Overview

JSON Tree is a web application that provides:
- Interactive tree visualization of JSON data
- Graph-based visualization for complex structures
- JSON formatting, minification, and validation
- Search functionality across keys and values
- REST API for programmatic access
- MCP (Model Context Protocol) server for AI integration

## Website
${BASE_URL}

## API Endpoints

Base URL: ${BASE_URL}/api/v1

### Parse JSON
POST /api/v1/parse
- Input: { "json": "<json-string>", "options": { "includeStats": true } }
- Output: Tree structure with statistics

### Format JSON
POST /api/v1/format
- Input: { "json": "<json-string>", "indent": 2 }
- Output: Formatted JSON string

### Minify JSON
POST /api/v1/minify
- Input: { "json": "<json-string>" }
- Output: Minified JSON string

### Validate JSON
POST /api/v1/validate
- Input: { "json": "<json-string>" }
- Output: Validation result with error details

### Diff JSON
POST /api/v1/diff
- Input: { "source": "<json-string>", "target": "<json-string>" }
- Output: Differences between two JSON objects

## MCP Server

JSON Tree includes an MCP server for AI agent integration.

Endpoint: ${BASE_URL}/api/mcp

### Available Tools

1. **parse_json** - Parse JSON into a tree structure
2. **format_json** - Pretty-print JSON
3. **minify_json** - Remove whitespace from JSON
4. **validate_json** - Check if JSON is valid
5. **diff_json** - Compare two JSON objects
6. **search_json** - Search within JSON structure
7. **get_json_stats** - Get statistics about JSON

## Rate Limits

- 100 requests per minute per IP
- No authentication required for basic usage

## Documentation

- OpenAPI Spec: ${BASE_URL}/api/docs
- MCP Info: ${BASE_URL}/api/mcp

## Contact

support@json-tree.vercel.app
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
