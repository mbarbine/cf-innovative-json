import { writeFileSync } from 'node:fs'

const canaryUrl = (process.env.CLOUDFLARE_CANARY_URL || '').replace(/\/$/, '')
const productionUrl = (process.env.PRODUCTION_JSON_URL || 'https://json.platphormnews.com').replace(/\/$/, '')
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 12_000)
const mode = process.env.SMOKE_MODE || 'remote'
const reportPath = process.env.SMOKE_REPORT_PATH || 'smoke-report.json'

if (!canaryUrl || !/^https?:\/\//.test(canaryUrl)) {
  console.error('CLOUDFLARE_CANARY_URL must be an absolute HTTP(S) URL.')
  process.exit(2)
}

const results = []
const startedAt = new Date().toISOString()

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized)
  if (!value || typeof value !== 'object') return value
  const dynamic = new Set([
    'timestamp', 'requestId', 'traceId', 'spanId', 'traceUrl', 'uptime', 'uptimeScope',
    'platform', 'vercel', 'lastTraceExportAt', 'cfRay', 'rayId',
  ])
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !dynamic.has(key))
    .map(([key, child]) => [key, normalized(child)]))
}

function normalizedForParity(value, path) {
  const result = normalized(value)
  if (path === '/openapi.json' && result?.['x-platphorm']) {
    delete result['x-platphorm'].routeCount
  }
  return result
}

async function timedFetch(url, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { redirect: 'manual', ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function check(name, run) {
  const start = Date.now()
  try {
    const details = await run()
    results.push({ name, ok: true, durationMs: Date.now() - start, details })
  } catch (error) {
    results.push({ name, ok: false, durationMs: Date.now() - start, error: error instanceof Error ? error.message : String(error) })
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function expectStatus(base, path, expected = 200, init) {
  const response = await timedFetch(`${base}${path}`, init)
  assert(response.status === expected, `${path} returned ${response.status}; expected ${expected}`)
  return response
}

const getRoutes = [
  '/api/health',
  '/api/v1/health',
  '/api/docs',
  '/openapi.json',
  '/llms.txt',
  '/api/v1/schemas',
  '/api/v1/schema-pack',
  '/api/v1/jsonld',
  '/api/mcp',
  '/api/v1/mcp',
  '/api/mcp/register',
  '/.well-known/platphorm.json',
]

for (const path of getRoutes) {
  await check(`GET ${path}`, async () => {
    const response = await expectStatus(canaryUrl, path)
    return { status: response.status, contentType: response.headers.get('content-type') }
  })
}

const posts = [
  ['/api/v1/parse', { json: '{"hello":"world"}' }],
  ['/api/v1/format', { json: '{"nested":{"ok":true}}', indent: 2 }],
  ['/api/v1/minify', { json: '{\n  "hello": "world"\n}' }],
  ['/api/v1/validate', { json: '{"hello":"world"}' }],
  ['/api/v1/stats', { json: '{"nested":{"items":[1,2,3]}}' }],
  ['/api/v1/diff', { source: '{"status":"before"}', target: '{"status":"after"}' }],
  ['/api/v1/schema/validate', {
    schemaSlug: 'realm',
    json: JSON.stringify({
      id: 100,
      universe_id: 1,
      slug: 'json-tree-schema-registry',
      name: 'JSON Tree + PlatPhorm Schema Registry',
      realm_type: 'utility-platform',
      primary_domain: 'json.platphormnews.com',
      canonical_url: 'https://json.platphormnews.com',
      environment: 'production',
      visibility: 'public',
      feature_tags: ['json'],
      environment_tags: ['production'],
      governance_tags: ['public'],
    }),
  }],
]

for (const [path, body] of posts) {
  await check(`POST ${path}`, async () => {
    const response = await expectStatus(canaryUrl, path, 200, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await response.json()
    assert(json.ok === true, `${path} did not return the ok envelope`)
    return { status: response.status }
  })
}

await check('malformed JSON fixture', async () => {
  const response = await expectStatus(canaryUrl, '/api/v1/parse', 400, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: '{bad' }),
  })
  return { status: response.status }
})

await check('one-MiB application limit', async () => {
  const response = await expectStatus(canaryUrl, '/api/v1/parse', 400, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: JSON.stringify('x'.repeat(1024 * 1024)) }),
  })
  const body = await response.json()
  assert(body.error?.code === 'INVALID_JSON', 'oversize payload did not use the validation boundary')
  return { status: response.status, code: body.error.code }
})

await check('MCP JSON-RPC', async () => {
  const response = await expectStatus(canaryUrl, '/api/mcp', 200, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  })
  const body = await response.json()
  assert(Array.isArray(body.result?.tools), 'MCP tools/list did not return tools')
  return { status: response.status, toolCount: body.result.tools.length }
})

await check('MCP SSE first event and bounded abort', async () => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 4_000))
  try {
    const response = await fetch(`${canaryUrl}/api/mcp/sse`, { signal: controller.signal })
    assert(response.status === 200 && response.body, `SSE returned ${response.status}`)
    const reader = response.body.getReader()
    const first = await reader.read()
    const text = new TextDecoder().decode(first.value || new Uint8Array())
    assert(text.includes('connection/established'), 'SSE initial event was not connection/established')
    controller.abort()
    try { await reader.cancel() } catch { /* abort is the expected cleanup path */ }
    return { status: response.status, initialEvent: 'connection/established', aborted: true }
  } finally {
    clearTimeout(timer)
  }
})

await check('canonical and canary noindex', async () => {
  const response = await expectStatus(canaryUrl, '/')
  const html = await response.text()
  assert(response.headers.get('x-robots-tag')?.includes('noindex'), 'missing canary X-Robots-Tag')
  assert(/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html) || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots/i.test(html), 'missing noindex HTML metadata')
  assert(html.includes('https://json.platphormnews.com'), 'missing production canonical identity')
  return { status: response.status, canonical: 'production', noindex: true }
})

await check('canary robots disallow', async () => {
  const response = await expectStatus(canaryUrl, '/robots.txt')
  const text = await response.text()
  assert(text.trim() === 'User-agent: *\nDisallow: /', 'canary robots policy is not disallow-all')
  return { status: response.status }
})

await check('trace context propagation and CORS', async () => {
  const traceId = '0123456789abcdef0123456789abcdef'
  const response = await expectStatus(canaryUrl, '/api/v1/parse', 200, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      traceparent: `00-${traceId}-0123456789abcdef-01`,
      tracestate: 'smoke=value',
    },
    body: JSON.stringify({ json: '{"hello":"world"}' }),
  })
  assert(response.headers.get('traceparent')?.includes(traceId), 'trace ID was not propagated')
  assert(response.headers.get('access-control-allow-origin') === '*', 'critical CORS header is missing')
  return { status: response.status, tracePropagated: true, cors: true }
})

await check('redirect isolation', async () => {
  const canary = await timedFetch(`${canaryUrl}/api/health`)
  assert(![301, 302, 307, 308].includes(canary.status), 'canary unexpectedly redirects')
  if (mode !== 'local' && productionUrl !== canaryUrl) {
    const production = await timedFetch(`${productionUrl}/api/health`)
    const location = production.headers.get('location') || ''
    assert(!location.includes('json.innovativefuturesolutions.com'), 'production redirects to the canary')
  }
  return { canaryStatus: canary.status, productionChecked: mode !== 'local' && productionUrl !== canaryUrl }
})

if (mode !== 'local' && productionUrl !== canaryUrl) {
  for (const path of ['/api/v1/schema-pack', '/openapi.json']) {
    await check(`parity ${path}`, async () => {
      const [canaryResponse, productionResponse] = await Promise.all([
        expectStatus(canaryUrl, path),
        expectStatus(productionUrl, path),
      ])
      const [canaryBody, productionBody] = await Promise.all([canaryResponse.json(), productionResponse.json()])
      if (path === '/openapi.json') {
        const operationCount = canaryBody?.['x-platphorm']?.routeCount
        assert(Number.isInteger(operationCount) && operationCount >= Object.keys(canaryBody?.paths || {}).length, 'canary OpenAPI routeCount is not a valid operation count')
      }
      assert(JSON.stringify(normalizedForParity(canaryBody, path)) === JSON.stringify(normalizedForParity(productionBody, path)), `${path} differs after dynamic-field normalization`)
      return { status: 'equal-after-normalization' }
    })
  }
}

const failed = results.filter((result) => !result.ok)
const report = {
  target: canaryUrl,
  productionTarget: mode === 'local' ? null : productionUrl,
  mode,
  startedAt,
  finishedAt: new Date().toISOString(),
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
}

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
console.error(`Cloudflare smoke: ${report.summary.passed}/${report.summary.total} passed; report ${reportPath}`)
console.log(JSON.stringify(report))
process.exitCode = failed.length ? 1 : 0
