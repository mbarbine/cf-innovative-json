export const PRODUCTION_JSON_URL = 'https://json.platphormnews.com'
export const CLOUDFLARE_CANARY_URL = 'https://json.innovativefuturesolutions.com'

export type DeploymentProvider = 'vercel' | 'cloudflare' | 'local'
export type DeploymentEnvironment = 'development' | 'preview' | 'production' | 'canary'

export type DeploymentConfig = {
  provider: DeploymentProvider
  environment: DeploymentEnvironment
  canary: boolean
  appUrl: string
  canonicalUrl: string
  traceBaseUrl: string
  requireApiKey: boolean
  runtime: 'vercel-functions' | 'cloudflare-workers' | 'nodejs'
}

type Environment = Record<string, string | undefined>

function absoluteHttpUrl(value: string | undefined, fallback: string): string {
  try {
    const url = new URL(value || fallback)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback
    return url.origin
  } catch {
    return fallback
  }
}

function providerFrom(env: Environment): DeploymentProvider {
  if (env.DEPLOYMENT_PROVIDER === 'vercel' || env.DEPLOYMENT_PROVIDER === 'cloudflare' || env.DEPLOYMENT_PROVIDER === 'local') {
    return env.DEPLOYMENT_PROVIDER
  }
  return env.VERCEL || env.VERCEL_ENV ? 'vercel' : 'local'
}

function environmentFrom(env: Environment): DeploymentEnvironment {
  const candidate = env.DEPLOYMENT_ENVIRONMENT || env.VERCEL_ENV || env.NODE_ENV || 'development'
  return candidate === 'preview' || candidate === 'production' || candidate === 'canary'
    ? candidate
    : 'development'
}

export function getDeploymentConfig(env: Environment = process.env): DeploymentConfig {
  const provider = providerFrom(env)
  const environment = environmentFrom(env)
  const canary = env.PLATPHORM_CANARY === 'true' || environment === 'canary'
  const defaultAppUrl = canary
    ? CLOUDFLARE_CANARY_URL
    : provider === 'local'
      ? 'http://localhost:3000'
      : PRODUCTION_JSON_URL

  return {
    provider,
    environment,
    canary,
    appUrl: absoluteHttpUrl(env.NEXT_PUBLIC_APP_URL, defaultAppUrl),
    canonicalUrl: absoluteHttpUrl(env.NEXT_PUBLIC_CANONICAL_URL, PRODUCTION_JSON_URL),
    traceBaseUrl: absoluteHttpUrl(env.PLATPHORM_TRACE_BASE_URL, 'https://trace.platphormnews.com'),
    requireApiKey: env.PLATPHORM_REQUIRE_API_KEY === 'true',
    runtime: provider === 'cloudflare' ? 'cloudflare-workers' : provider === 'vercel' ? 'vercel-functions' : 'nodejs',
  }
}

export function getSeoPolicy(env: Environment = process.env) {
  const deployment = getDeploymentConfig(env)
  return {
    canonicalUrl: deployment.canonicalUrl,
    index: !deployment.canary,
    follow: !deployment.canary,
    robotsHeader: deployment.canary ? 'noindex, nofollow, noarchive' : null,
  }
}

export function shouldRenderVercelAnalytics(env: Environment = process.env): boolean {
  return getDeploymentConfig(env).provider === 'vercel'
}
