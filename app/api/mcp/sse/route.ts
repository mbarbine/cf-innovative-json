import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

// MCP SSE endpoint for streaming communication
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const event = `data: ${JSON.stringify({
        jsonrpc: '2.0',
        method: 'connection/established',
        params: {
          serverName: 'json-tree-mcp',
          version: '1.0.0',
        },
      })}\n\n`
      
      controller.enqueue(encoder.encode(event))

      // Keep connection alive with periodic pings
      const interval = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`
          controller.enqueue(encoder.encode(ping))
        } catch {
          clearInterval(interval)
          controller.close()
        }
      }, 30000)

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
