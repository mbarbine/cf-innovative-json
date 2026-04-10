import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { ApiResponse } from './types'

export const API_VERSION = 'v1'
export const APP_VERSION = '1.0.0'

// Generate unique request ID
export function generateRequestId(): string {
  return uuidv4()
}

// Standard API response wrapper
export function apiResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: status >= 200 && status < 300,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
        version: APP_VERSION,
      },
    },
    { status }
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
  status: number = 400,
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
        version: APP_VERSION,
      },
    },
    { status }
  )
}

// Rate limiting - simple in-memory implementation
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
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

// CORS headers
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key',
    'Access-Control-Max-Age': '86400',
  }
}

// Get client IP for rate limiting
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

// Validate JSON string
export function validateJsonString(json: string): { valid: boolean; parsed?: unknown; error?: string } {
  try {
    const parsed = JSON.parse(json)
    return { valid: true, parsed }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

// Format JSON with indentation
export function formatJsonString(json: string, indent: number = 2): string {
  const parsed = JSON.parse(json)
  return JSON.stringify(parsed, null, indent)
}

// Minify JSON
export function minifyJsonString(json: string): string {
  const parsed = JSON.parse(json)
  return JSON.stringify(parsed)
}

// Calculate JSON statistics
export function calculateJsonStats(value: unknown, depth: number = 0): {
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
      val.forEach(item => traverse(item, d + 1))
    } else if (typeof val === 'object' && val !== null) {
      Object.values(val).forEach(v => traverse(v, d + 1))
    }
  }

  traverse(value, depth)
  return { totalNodes, maxDepth, types }
}
