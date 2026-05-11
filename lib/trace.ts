import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { PLATFORM_SOURCE_SITE } from './platform'

export type TraceContext = {
  traceId: string
  spanId: string
  parentSpanId: string | null
  requestId: string
  traceparent: string
  tracestate: string | null
  traceUrl: string
}

export type VercelRequestMetadata = {
  vercelId: string | null
  forwardedHost: string | null
  forwardedProto: string | null
  forwardedForHash: string | null
  realIpHash: string | null
  country: string | null
  countryRegion: string | null
  city: string | null
  timezone: string | null
  userAgent: string | null
  acceptLanguage: string | null
  host: string | null
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex')
}

function hashNullable(value: string | null): string | null {
  if (!value) return null
  return createHash('sha256').update(value).digest('hex').slice(0, 24)
}

export function createTraceContext(headers?: Headers, operation = 'json_operation'): TraceContext {
  const incomingTraceparent = headers?.get('traceparent') ?? null
  const tracestate = headers?.get('tracestate') ?? null
  const requestId = headers?.get('x-platphorm-request-id') || headers?.get('x-request-id') || randomUUID()
  const parentParts = incomingTraceparent?.split('-')
  const incomingTraceId = parentParts?.[1]?.match(/^[a-f0-9]{32}$/) ? parentParts[1] : null
  const incomingParentSpanId = parentParts?.[2]?.match(/^[a-f0-9]{16}$/) ? parentParts[2] : null
  const traceId = incomingTraceId || randomHex(16)
  const spanId = randomHex(8)
  const traceparent = `00-${traceId}-${spanId}-01`

  return {
    traceId,
    spanId,
    parentSpanId: incomingParentSpanId,
    requestId,
    traceparent,
    tracestate,
    traceUrl: `https://trace.platphormnews.com/traces/${traceId}?source=${PLATFORM_SOURCE_SITE}&operation=${encodeURIComponent(operation)}`,
  }
}

export function traceHeaders(context: TraceContext, targetSite?: string): Record<string, string> {
  const headers: Record<string, string> = {
    traceparent: context.traceparent,
    'X-PlatPhorm-Trace-Id': context.traceId,
    'X-PlatPhorm-Span-Id': context.spanId,
    'X-PlatPhorm-Request-Id': context.requestId,
    'X-PlatPhorm-Source-Site': PLATFORM_SOURCE_SITE,
  }

  if (context.tracestate) headers.tracestate = context.tracestate
  if (context.parentSpanId) headers['X-PlatPhorm-Parent-Span-Id'] = context.parentSpanId
  if (targetSite) headers['X-PlatPhorm-Target-Site'] = targetSite

  return headers
}

export function captureVercelRequestMetadata(headers: Headers): VercelRequestMetadata {
  return {
    vercelId: headers.get('x-vercel-id'),
    forwardedHost: headers.get('x-forwarded-host'),
    forwardedProto: headers.get('x-forwarded-proto'),
    forwardedForHash: hashNullable(headers.get('x-forwarded-for')),
    realIpHash: hashNullable(headers.get('x-real-ip') || headers.get('x-vercel-forwarded-for')),
    country: headers.get('x-vercel-ip-country'),
    countryRegion: headers.get('x-vercel-ip-country-region'),
    city: headers.get('x-vercel-ip-city'),
    timezone: headers.get('x-vercel-ip-timezone'),
    userAgent: headers.get('user-agent'),
    acceptLanguage: headers.get('accept-language'),
    host: headers.get('host'),
  }
}

export function traceMetadata(headers?: Headers, operation = 'json_operation') {
  const trace = createTraceContext(headers, operation)
  return {
    trace,
    vercel: headers ? captureVercelRequestMetadata(headers) : null,
  }
}
