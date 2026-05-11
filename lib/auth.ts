import type { NextRequest } from 'next/server'

export type AuthBoundary = 'public' | 'public-safe' | 'future-protected' | 'protected'

export type AuthPolicy = {
  requiredNow: boolean
  boundary: AuthBoundary
  acceptedHeaders: string[]
  environmentFlag: 'PLATPHORM_REQUIRE_API_KEY'
  keyName: 'PLATPHORM_API_KEY'
  publicSafeDefault: boolean
}

export type AuthResult = {
  allowed: boolean
  requiredNow: boolean
  boundary: AuthBoundary
  reason: string
}

export function isApiKeyEnforcementEnabled(): boolean {
  return process.env.PLATPHORM_REQUIRE_API_KEY === 'true'
}

export function getAuthPolicy(boundary: AuthBoundary = 'public-safe'): AuthPolicy {
  return {
    requiredNow: boundary === 'protected' || (boundary === 'future-protected' && isApiKeyEnforcementEnabled()),
    boundary,
    acceptedHeaders: ['Authorization: Bearer $PLATPHORM_API_KEY', 'X-PlatPhorm-API-Key: $PLATPHORM_API_KEY'],
    environmentFlag: 'PLATPHORM_REQUIRE_API_KEY',
    keyName: 'PLATPHORM_API_KEY',
    publicSafeDefault: !isApiKeyEnforcementEnabled(),
  }
}

function readPresentedKey(request: Request | NextRequest): string | null {
  const authorization = request.headers.get('authorization')
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim()
  }

  return request.headers.get('x-platphorm-api-key')
}

export function verifyPlatformAuth(
  request: Request | NextRequest,
  boundary: AuthBoundary = 'future-protected',
): AuthResult {
  const policy = getAuthPolicy(boundary)
  const configuredKey = process.env.PLATPHORM_API_KEY

  if (!policy.requiredNow) {
    return {
      allowed: true,
      requiredNow: false,
      boundary,
      reason: 'Public-safe Phase 1 access is enabled. PLATPHORM_API_KEY support is scaffolded for future protected actions.',
    }
  }

  if (!configuredKey) {
    return {
      allowed: false,
      requiredNow: true,
      boundary,
      reason: 'PLATPHORM_API_KEY is not configured for this protected action.',
    }
  }

  const presentedKey = readPresentedKey(request)
  if (presentedKey && presentedKey === configuredKey) {
    return {
      allowed: true,
      requiredNow: true,
      boundary,
      reason: 'PLATPHORM_API_KEY accepted.',
    }
  }

  return {
    allowed: false,
    requiredNow: true,
    boundary,
    reason: 'This protected action requires Authorization: Bearer $PLATPHORM_API_KEY or X-PlatPhorm-API-Key.',
  }
}

export function isVercelCronRequest(request: Request | NextRequest): boolean {
  return request.headers.get('x-vercel-cron') === '1' || request.headers.get('user-agent')?.includes('vercel-cron') === true
}
