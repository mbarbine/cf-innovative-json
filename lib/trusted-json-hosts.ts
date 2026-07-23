export const APPROVED_DEMO_JSON_HOSTS = [
  'innovativefuturesolutions.com',
  'www.innovativefuturesolutions.com',
  'platphorm-json-canary.barbine-michael.workers.dev',
] as const

export function isTrustedPublicJsonHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '')
  if (normalized === 'platphormnews.com' || normalized.endsWith('.platphormnews.com')) {
    return true
  }
  return APPROVED_DEMO_JSON_HOSTS.some(host => normalized === host)
}

export const TRUSTED_PUBLIC_JSON_SCOPE =
  '*.platphormnews.com plus the approved Innovative Future Solutions demo origins'
