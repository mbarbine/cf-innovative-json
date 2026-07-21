import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { PLATFORM_SOURCE_SITE, SERVICE_DOMAIN } from './platform'

export type TraceContext = {
  traceId: string
  spanId: string
  parentSpanId: string | null
  requestId: string
  traceparent: string
  tracestate: string | null
  baggage: string | null
  workflowRunId: string | null
  testRunId: string | null
  agentRunId: string | null
  sessionId: string | null
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
  const tracestate = safeTracestate(headers?.get('tracestate') ?? null)
  const baggage = safeBaggage(headers?.get('baggage') ?? null)
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
    baggage,
    workflowRunId: safeIdentifier(headers?.get('x-platphorm-workflow-run-id')),
    testRunId: safeIdentifier(headers?.get('x-platphorm-test-run-id')),
    agentRunId: safeIdentifier(headers?.get('x-platphorm-agent-run-id')),
    sessionId: safeIdentifier(headers?.get('x-platphorm-session-id')),
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
  if (context.baggage) headers.baggage = context.baggage
  if (context.parentSpanId) headers['X-PlatPhorm-Parent-Span-Id'] = context.parentSpanId
  if (targetSite) headers['X-PlatPhorm-Target-Site'] = targetSite
  if (context.workflowRunId) headers['X-PlatPhorm-Workflow-Run-Id'] = context.workflowRunId
  if (context.testRunId) headers['X-PlatPhorm-Test-Run-Id'] = context.testRunId
  if (context.agentRunId) headers['X-PlatPhorm-Agent-Run-Id'] = context.agentRunId
  if (context.sessionId) headers['X-PlatPhorm-Session-Id'] = context.sessionId

  return headers
}

function safeIdentifier(value: string | null | undefined) {
  const candidate = value?.trim() || ''
  return /^[A-Za-z0-9._:-]{1,128}$/.test(candidate) ? candidate : null
}

function safeTracestate(value: string | null) {
  return value && value.length <= 512 && /^[\x20-\x7e]+$/.test(value) && !/(authorization|cookie|secret|token|api.?key)/i.test(value) ? value : null
}

function safeBaggage(value: string | null) {
  if (!value || value.length > 512 || /[\r\n]/.test(value)) return null
  const allowed = new Set(['platphorm.workflow_run_id', 'platphorm.test_run_id', 'platphorm.agent_run_id', 'platphorm.session_id'])
  const entries = value.split(',').map((entry) => entry.trim()).filter((entry) => {
    const index = entry.indexOf('=')
    return index > 0 && allowed.has(entry.slice(0, index).toLowerCase()) && /^[A-Za-z0-9._~:%-]{1,128}$/.test(entry.slice(index + 1).split(';')[0]?.trim() || '')
  }).slice(0, 8)
  return entries.length ? entries.join(',') : null
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

export type JsonSpanSummary = {
  intent: string
  input: string
  output: string
  evidence: string
}

const TRACE_ORIGIN = process.env.PLATPHORM_TRACE_BASE_URL || 'https://trace.platphormnews.com'

function safeSpanSummary(value: string) {
  return value.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]').slice(0, 500)
}

async function emitJsonLifecycle(path: string, apiKey: string, context: TraceContext, payload: Record<string, unknown>) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_800)
  try {
    const response = await fetch(`${TRACE_ORIGIN}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        'X-PlatPhorm-API-Key': apiKey,
        ...traceHeaders(context, 'trace.platphormnews.com'),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function exportJsonSpan(input: {
  context: TraceContext
  operation: string
  startTime: string
  status?: 'completed' | 'failed'
  summary: JsonSpanSummary
}) {
  const apiKey = process.env.PLATPHORM_API_KEY || ''
  if (!apiKey) return { traceId: input.context.traceId, spanId: input.context.spanId, status: 'disabled' as const }
  const metadata = {
    traceName: `JSON ${input.operation}`,
    agentName: 'PlatPhorm JSON',
    sourceDomain: SERVICE_DOMAIN,
    traceClass: 'product',
    operationFingerprint: `json:${input.operation}:v1`,
    intent: safeSpanSummary(input.summary.intent),
    input: safeSpanSummary(input.summary.input),
    output: safeSpanSummary(input.summary.output),
    evidence: safeSpanSummary(input.summary.evidence),
  }
  const common = {
    traceId: input.context.traceId,
    spanId: input.context.spanId,
    parentSpanId: input.context.parentSpanId,
    name: `JSON ${input.operation}`,
    kind: 'SERVER',
    sourceSite: SERVICE_DOMAIN,
    targetSite: SERVICE_DOMAIN,
    serviceName: 'json',
    apiOperation: input.operation,
    startTime: input.startTime,
    publicSafe: true,
    protected: false,
    tags: ['product'],
    metadata,
  }
  const started = await emitJsonLifecycle('/api/v1/spans/start', apiKey, input.context, common)
  const terminal = await emitJsonLifecycle(
    input.status === 'failed' ? '/api/v1/spans/fail' : '/api/v1/spans/complete',
    apiKey,
    input.context,
    {
      ...common,
      endTime: new Date().toISOString(),
      ...(input.status === 'failed' ? { errorCode: 'JSON_OPERATION_FAILED', errorMessage: `JSON ${input.operation} failed.` } : {}),
    },
  )
  return {
    traceId: input.context.traceId,
    spanId: input.context.spanId,
    status: started && terminal ? 'connected' as const : 'degraded' as const,
  }
}
