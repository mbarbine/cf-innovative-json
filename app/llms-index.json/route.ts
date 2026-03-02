import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com'

export async function GET() {
  const index = {
    name: 'JSON Tree by Platphorm',
    version: '0.0.1',
    description: 'A powerful JSON visualization and manipulation tool by Platphorm News',
    author: 'Platphorm News',
    website: BASE_URL,
    llmsTxt: `${BASE_URL}/llms.txt`,
    llmsFullTxt: `${BASE_URL}/llms-full.txt`,
    documentation: {
      openapi: `${BASE_URL}/api/docs`,
      sitemap: `${BASE_URL}/sitemap.xml`,
      rss: `${BASE_URL}/feed.xml`,
    },
    api: {
      base: `${BASE_URL}/api/v1`,
      endpoints: [
        {
          path: '/api/v1/parse',
          method: 'POST',
          description: 'Parse JSON into tree structure',
        },
        {
          path: '/api/v1/format',
          method: 'POST',
          description: 'Format/pretty-print JSON',
        },
        {
          path: '/api/v1/minify',
          method: 'POST',
          description: 'Minify JSON',
        },
        {
          path: '/api/v1/validate',
          method: 'POST',
          description: 'Validate JSON',
        },
        {
          path: '/api/v1/diff',
          method: 'POST',
          description: 'Compare two JSON objects',
        },
      ],
      rateLimit: {
        requests: 100,
        window: '1 minute',
        per: 'IP',
      },
    },
    mcp: {
      endpoint: `${BASE_URL}/api/mcp`,
      protocol: 'MCP 2024-11-05',
      tools: [
        {
          name: 'parse_json',
          description: 'Parse JSON into a tree structure with statistics',
        },
        {
          name: 'format_json',
          description: 'Format JSON with customizable indentation',
        },
        {
          name: 'minify_json',
          description: 'Remove whitespace from JSON',
        },
        {
          name: 'validate_json',
          description: 'Check if string is valid JSON',
        },
        {
          name: 'diff_json',
          description: 'Compare two JSON objects',
        },
        {
          name: 'search_json',
          description: 'Search within JSON structure',
        },
        {
          name: 'get_json_stats',
          description: 'Get statistics about JSON',
        },
      ],
    },
    features: [
      'Tree visualization',
      'Graph visualization',
      'JSON formatting',
      'JSON minification',
      'JSON validation',
      'Search functionality',
      'Dark/light theme',
      'REST API',
      'MCP Server',
      'Keyboard shortcuts',
    ],
    contact: {
      name: 'Platphorm News',
      website: 'https://platphormnews.com',
      email: 'support@platphormnews.com',
    },
    updated: new Date().toISOString(),
  }

  return NextResponse.json(index, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
