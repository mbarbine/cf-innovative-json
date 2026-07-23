export const SECURITY_CONTROLS_SOURCE_URL =
  'https://innovativefuturesolutions.com/api/security-controls'

export const DEFAULT_SECURITY_CONTROLS_VIEW = 'graph' as const

export type SecurityControlTone = 'waf' | 'bots' | 'apiGateway' | 'rateLimit'

export interface SecurityControlsSnapshot {
  json: string
  sourceUrl: string
  live: boolean
  capturedAt: string | null
  message: string
}

const MAX_SECURITY_CONTROLS_BYTES = 256 * 1024
const SECURITY_CONTROLS_TIMEOUT_MS = 5_000

const FALLBACK_SECURITY_CONTROLS = {
  ok: false,
  data: {
    source: 'Innovative Future Solutions Cloudflare security controls',
    sourceUrl: SECURITY_CONTROLS_SOURCE_URL,
    status: 'live-source-unavailable',
    message: 'The live control snapshot is temporarily unavailable. Reload to retry.',
    waf: {
      status: 'unknown',
      control: 'Custom rule demonstration',
    },
    bots: {
      status: 'unknown',
      control: 'Bot protection posture',
    },
    apiGateway: {
      status: 'unknown',
      control: 'API endpoint inventory',
    },
    rateLimit: {
      status: 'unknown',
      control: 'Burst protection policy',
    },
  },
}

export const DEFAULT_SECURITY_CONTROLS_JSON = JSON.stringify(
  FALLBACK_SECURITY_CONTROLS,
  null,
  2,
)

function isSecurityControlsPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const payload = value as Record<string, unknown>
  return typeof payload.ok === 'boolean' && !!payload.data && typeof payload.data === 'object'
}

export function getSecurityControlTone(path: string[]): SecurityControlTone | null {
  for (const segment of path) {
    if (segment === 'waf') return 'waf'
    if (segment === 'bots') return 'bots'
    if (segment === 'apiGateway') return 'apiGateway'
    if (segment === 'rateLimit') return 'rateLimit'
  }
  return null
}

export function formatSecuritySnapshotTime(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
}

export async function loadSecurityControlsSnapshot(
  fetcher: typeof fetch = fetch,
): Promise<SecurityControlsSnapshot> {
  try {
    const response = await fetcher(SECURITY_CONTROLS_SOURCE_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'cf-innovative-json-canary/1.0',
      },
      signal: AbortSignal.timeout(SECURITY_CONTROLS_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`Upstream returned HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('application/json')) {
      throw new Error('Upstream did not return application/json')
    }

    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > MAX_SECURITY_CONTROLS_BYTES) {
      throw new Error('Upstream payload exceeded the demo size limit')
    }

    const parsed: unknown = JSON.parse(text)
    if (!isSecurityControlsPayload(parsed)) {
      throw new Error('Upstream payload did not match the control snapshot envelope')
    }

    const data = parsed.data as Record<string, unknown>
    const capturedAt = typeof data.capturedAt === 'string' ? data.capturedAt : null

    return {
      json: JSON.stringify(parsed, null, 2),
      sourceUrl: SECURITY_CONTROLS_SOURCE_URL,
      live: true,
      capturedAt,
      message: 'Live Cloudflare security controls loaded server-side.',
    }
  } catch {
    return {
      json: DEFAULT_SECURITY_CONTROLS_JSON,
      sourceUrl: SECURITY_CONTROLS_SOURCE_URL,
      live: false,
      capturedAt: null,
      message: 'Live source unavailable; displaying the labeled security-control fallback.',
    }
  }
}
