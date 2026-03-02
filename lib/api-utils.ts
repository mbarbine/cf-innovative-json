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
