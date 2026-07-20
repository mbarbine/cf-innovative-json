'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

const endpoints = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    response: `{
  "ok": true,
  "data": {
    "status": "healthy",
    "version": "1.4.0",
    "uptime": 12345
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/parse',
    description: 'Parse JSON into tree structure',
    body: `{
  "json": "{\\"name\\": \\"test\\"}",
  "options": {
    "includeStats": true
  }
}`,
    response: `{
  "ok": true,
  "data": {
    "tree": { ... },
    "stats": {
      "totalNodes": 2,
      "maxDepth": 1
    }
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/format',
    description: 'Format/pretty-print JSON',
    body: `{
  "json": "{\\"a\\":1,\\"b\\":2}",
  "indent": 2
}`,
    response: `{
  "ok": true,
  "data": {
    "formatted": "{\\n  \\"a\\": 1,\\n  \\"b\\": 2\\n}",
    "length": 24
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/minify',
    description: 'Minify JSON by removing whitespace',
    body: `{
  "json": "{\\n  \\"a\\": 1\\n}"
}`,
    response: `{
  "ok": true,
  "data": {
    "minified": "{\\"a\\":1}",
    "saved": 12,
    "savedPercent": 60
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/validate',
    description: 'Validate JSON syntax',
    body: `{
  "json": "{\\"valid\\": true}"
}`,
    response: `{
  "ok": true,
  "data": {
    "valid": true,
    "stats": { ... }
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/diff',
    description: 'Compare two JSON objects',
    body: `{
  "source": "{\\"a\\": 1}",
  "target": "{\\"a\\": 2, \\"b\\": 3}"
}`,
    response: `{
  "ok": true,
  "data": {
    "diff": {
      "added": ["b"],
      "removed": [],
      "modified": [{ "path": "a", "oldValue": 1, "newValue": 2 }]
    }
  }
}`
  },
]

const mcpTools = [
  {
    name: 'parse_json',
    description: 'Parse JSON into a tree structure with statistics',
    params: [
      { name: 'json', type: 'string', required: true },
      { name: 'includeStats', type: 'boolean', required: false }
    ]
  },
  {
    name: 'format_json',
    description: 'Format JSON with customizable indentation',
    params: [
      { name: 'json', type: 'string', required: true },
      { name: 'indent', type: 'number', required: false }
    ]
  },
  {
    name: 'minify_json',
    description: 'Remove all whitespace from JSON',
    params: [
      { name: 'json', type: 'string', required: true }
    ]
  },
  {
    name: 'validate_json',
    description: 'Check if a string is valid JSON',
    params: [
      { name: 'json', type: 'string', required: true }
    ]
  },
  {
    name: 'get_json_stats',
    description: 'Get detailed statistics about JSON',
    params: [
      { name: 'json', type: 'string', required: true }
    ]
  },
  {
    name: 'validate_against_schema',
    description: 'Validate JSON against a public PlatPhorm schema',
    params: [
      { name: 'json', type: 'string', required: true },
      { name: 'schemaSlug', type: 'string', required: true }
    ]
  },
  {
    name: 'list_schemas',
    description: 'List public schema registry files',
    params: []
  },
  {
    name: 'get_schema_pack',
    description: 'Get public schema pack metadata',
    params: []
  },
  {
    name: 'validate_jsonld',
    description: 'Validate JSON-LD structure locally',
    params: [
      { name: 'json', type: 'string', required: true }
    ]
  },
]

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group">
      <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: typeof endpoints[0] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono">{endpoint.path}</code>
        <span className="text-sm text-muted-foreground ml-auto">{endpoint.description}</span>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-border bg-muted/20 space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Endpoint</h4>
            <CodeBlock code={`${endpoint.method} ${BASE_URL}${endpoint.path}`} />
          </div>
          
          {endpoint.body && (
            <div>
              <h4 className="text-sm font-medium mb-2">Request Body</h4>
              <CodeBlock code={endpoint.body} />
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <CodeBlock code={endpoint.response} />
          </div>
        </div>
      )}
    </div>
  )
}

export function ApiDocsClient() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">
          Complete documentation for the JSON Tree + PlatPhorm Schema Registry REST API and MCP Server. Public-safe JSON and schema operations are open by default; future protected actions use PLATPHORM_API_KEY when enabled.
        </p>
      </div>

      <Tabs defaultValue="rest" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rest">REST API</TabsTrigger>
          <TabsTrigger value="mcp">MCP Server</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="rest" className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">Base URL</h3>
            <code className="text-sm bg-muted px-2 py-1 rounded">{BASE_URL || 'https://json.platphormnews.com'}/api/v1</code>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">Rate Limiting</h3>
            <p className="text-sm text-muted-foreground">100 requests per minute per IP address</p>
          </div>

          <div>
            <h3 className="font-medium mb-4">Endpoints</h3>
            <div className="space-y-3">
              {endpoints.map((endpoint, i) => (
                <EndpointCard key={i} endpoint={endpoint} />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <a href="/api/docs" target="_blank" rel="noopener noreferrer">
                OpenAPI Spec <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="mcp" className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">MCP Endpoint</h3>
            <code className="text-sm bg-muted px-2 py-1 rounded">{BASE_URL}/api/mcp</code>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">Protocol</h3>
            <p className="text-sm text-muted-foreground">MCP 2024-11-05 over HTTP (JSON-RPC 2.0)</p>
          </div>

          <div>
            <h3 className="font-medium mb-4">Available Tools</h3>
            <div className="space-y-4">
              {mcpTools.map((tool) => (
                <div key={tool.name} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono font-medium">{tool.name}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {tool.params.map((param) => (
                      <Badge key={param.name} variant={param.required ? 'default' : 'secondary'}>
                        {param.name}: {param.type}
                        {param.required && ' *'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Example Request</h3>
            <CodeBlock code={`POST ${BASE_URL}/api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "format_json",
    "arguments": {
      "json": "{\\"a\\":1}",
      "indent": 2
    }
  }
}`} />
          </div>
        </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is JSON Tree?</h3>
                  <p className="text-muted-foreground">JSON Tree is a powerful visualization tool built by Platphorm News. It provides an intuitive interface for editing, formatting, validating, and interacting with JSON data.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">How does this relate to other PlatPhorm services?</h3>
                  <p className="text-muted-foreground">JSON Tree is the JSON utility and schema registry layer. Other PlatPhorm services are integrations and are reported as degraded unless real backing behavior is configured.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is MCP?</h3>
                  <p className="text-muted-foreground">The Model Context Protocol (MCP) server allows AI agents (like Claude or Cursor) to securely execute JSON operations, formatting, and validation directly within their context window.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Is there an API available?</h3>
                  <p className="text-muted-foreground">Yes! Our REST API v1 supports parsing, formatting, validation, diffing, and minification. Check the REST API tab for detailed endpoint documentation.</p>
                </div>
              </div>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  )
}
