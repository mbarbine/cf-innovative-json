import { after, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { APP_VERSION } from './platform'
import { createTraceContext, traceHeaders, capturePlatformRequestMetadata, captureVercelRequestMetadata, exportJsonSpan, isRudimentaryJsonOperation, type TraceContext } from './trace'

export const API_VERSION = 'v1'
export const MAX_JSON_BYTES = 1024 * 1024

type ApiMeta = {
  timestamp: string
  requestId: string
  version: string
  traceId: string
  spanId: string
  traceUrl: string
  vercel?: ReturnType<typeof captureVercelRequestMetadata> | null
  platform?: ReturnType<typeof capturePlatformRequestMetadata> | null
}

export type ApiOk<T> = {
  ok: true
  data: T
  meta: ApiMeta
}

export type ApiFailure = {
  ok: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta: ApiMeta
}

export function generateRequestId(): string {
  return uuidv4()
}

function createMeta(requestId?: string, headers?: Headers, operation = 'json_api'): ApiMeta {
  const trace = createTraceContext(headers, operation)

  return {
    timestamp: new Date().toISOString(),
    requestId: requestId || trace.requestId || generateRequestId(),
    version: APP_VERSION,
    traceId: trace.traceId,
    spanId: trace.spanId,
    traceUrl: trace.traceUrl,
    vercel: headers ? captureVercelRequestMetadata(headers) : null,
    platform: headers ? capturePlatformRequestMetadata(headers) : null,
  }
}

export function requestStartedAt(headers?: Headers): string {
  const candidate = headers?.get('x-platphorm-request-started-at')
  const parsed = candidate ? Date.parse(candidate) : Number.NaN
  const now = Date.now()
  return Number.isFinite(parsed) && parsed <= now + 1_000 && parsed >= now - 10 * 60_000
    ? new Date(parsed).toISOString()
    : new Date(now).toISOString()
}

function scheduleJsonSpan(trace: TraceContext, operation: string, status: 'completed' | 'failed', httpStatus: number, startTime: string) {
  if (status === 'completed' && isRudimentaryJsonOperation(operation)) return 'suppressed'
  if (!process.env.PLATPHORM_API_KEY) return 'disabled'
  try {
    after(async () => {
      await exportJsonSpan({
        context: trace,
        operation,
        startTime,
        status,
        summary: {
          intent: `Execute the public-safe JSON ${operation} operation.`,
          input: 'Validated JSON request structure; raw JSON content and credentials were excluded.',
          output: `JSON operation returned HTTP ${httpStatus}.`,
          evidence: `Trace-linked ${operation} API response metadata.`,
        },
      })
    })
    return 'queued'
  } catch {
    return 'degraded'
  }
}

export function apiResponse<T>(
  data: T,
  status = 200,
  requestId?: string,
  headers?: Headers,
  operation = 'json_api',
): NextResponse<ApiOk<T>> {
  const trace = createTraceContext(headers, operation)
  const traceExport = scheduleJsonSpan(trace, operation, 'completed', status, requestStartedAt(headers))
  return NextResponse.json(
    {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || trace.requestId,
        version: APP_VERSION,
        traceId: trace.traceId,
        spanId: trace.spanId,
        traceUrl: trace.traceUrl,
        vercel: headers ? captureVercelRequestMetadata(headers) : null,
        platform: headers ? capturePlatformRequestMetadata(headers) : null,
      },
    },
    {
      status,
      headers: {
        ...corsHeaders(),
        ...traceHeaders(trace),
        'X-PlatPhorm-Trace-Export': traceExport,
      },
    },
  )
}

// Check if a URL is safe to fetch (prevent SSRF)
export function isSafeUrl(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString)
    const hostname = parsedUrl.hostname.toLowerCase()

    // Block localhost
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
      return false
    }

    // Block IPv4 loopback and private ranges
    // Loopback: 127.0.0.0/8
    // Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // Cloud metadata: 169.254.0.0/16
    const isPrivateIPv4 = /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)\d+/.test(hostname)
    const isLoopback = /^127\.\d+\.\d+\.\d+$/.test(hostname) || /^127\.\d+$/.test(hostname)
    const isObfuscatedIP = /^0x|^0\d|^\d+$/.test(hostname)

    if (isPrivateIPv4 || isLoopback || isObfuscatedIP) {
      return false
    }

    // Block IPv6 loopback and private ranges
    // Loopback: ::1
    // Unique local: fc00::/7
    // Link-local: fe80::/10
    const isPrivateIPv6 = hostname === '[::1]' || /^\[(fc|fd|fe[89ab])/i.test(hostname)

    if (isPrivateIPv6) {
      return false
    }

    return true
  } catch {
    return false // If we can't parse it, it's not safe
  }
}

// Standard error response
export function apiError(
  message: string,
  status = 400,
  requestId?: string,
  code = 'BAD_REQUEST',
  details?: Record<string, unknown>,
  headers?: Headers,
  operation = 'json_api_error',
): NextResponse<ApiFailure> {
  const trace = createTraceContext(headers, operation)
  const traceExport = scheduleJsonSpan(trace, operation, 'failed', status, requestStartedAt(headers))
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || trace.requestId,
        version: APP_VERSION,
        traceId: trace.traceId,
        spanId: trace.spanId,
        traceUrl: trace.traceUrl,
        vercel: headers ? captureVercelRequestMetadata(headers) : null,
        platform: headers ? capturePlatformRequestMetadata(headers) : null,
      },
    },
    {
      status,
      headers: {
        ...corsHeaders(),
        ...traceHeaders(trace),
        'X-PlatPhorm-Trace-Export': traceExport,
      },
    },
  )
}

// Best-effort process/isolate-local smoothing only. Cloudflare perimeter rules are authoritative for the canary.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit = 100,
  windowMs = 60000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-PlatPhorm-API-Key, X-Request-ID, X-PlatPhorm-Request-Id, traceparent, tracestate',
    'Access-Control-Expose-Headers':
      'X-PlatPhorm-Trace-Id, X-PlatPhorm-Span-Id, X-PlatPhorm-Request-Id, traceparent',
    'Access-Control-Max-Age': '86400',
  }
}

export function getClientIP(request: Request): string {
  const cloudflare = request.headers.get('cf-connecting-ip')
  if (cloudflare) return cloudflare.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export function validateJsonString(json: string): { valid: boolean; parsed?: unknown; error?: string; line?: number; column?: number } {
  if (new TextEncoder().encode(json).length > MAX_JSON_BYTES) {
    return { valid: false, error: `JSON payload exceeds the ${MAX_JSON_BYTES} byte public-safe Phase 1 limit.` }
  }

  try {
    const parsed = JSON.parse(json)
    return { valid: true, parsed }
  } catch (error) {
    const message = (error as Error).message
    const positionMatch = message.match(/position (\d+)/)
    const position = positionMatch ? Number(positionMatch[1]) : null
    if (position !== null && Number.isFinite(position)) {
      const before = json.slice(0, position)
      const lines = before.split('\n')
      return { valid: false, error: message, line: lines.length, column: lines[lines.length - 1].length + 1 }
    }
    return { valid: false, error: message }
  }
}

export function formatJsonString(json: string, indent = 2): string {
  const parsed = JSON.parse(json)
  return JSON.stringify(parsed, null, indent)
}

export function minifyJsonString(json: string): string {
  const parsed = JSON.parse(json)
  return JSON.stringify(parsed)
}

export function calculateJsonStats(value: unknown, depth = 0): {
  totalNodes: number
  maxDepth: number
  types: Record<string, number>
} {
  const types: Record<string, number> = {}
  let totalNodes = 0
  let maxDepth = depth

  function traverse(val: unknown, d: number) {
    totalNodes++
    maxDepth = Math.max(maxDepth, d)

    const type = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val
    types[type] = (types[type] || 0) + 1

    if (Array.isArray(val)) {
      val.forEach((item) => traverse(item, d + 1))
    } else if (typeof val === 'object' && val !== null) {
      Object.values(val).forEach((v) => traverse(v, d + 1))
    }
  }

  traverse(value, depth)
  return { totalNodes, maxDepth, types }
}

export function createOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export function apiMetaForTest(headers?: Headers) {
  return createMeta(undefined, headers)
}
