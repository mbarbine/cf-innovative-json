import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDeploymentConfig, getSeoPolicy, shouldRenderVercelAnalytics } from './deployment'
import { capturePlatformRequestMetadata } from './trace'
import { getClientIP } from './api-utils'
import { GET as robotsGet } from '@/app/robots.txt/route'

afterEach(() => vi.unstubAllEnvs())

describe('deployment contract', () => {
  it('parses production, Cloudflare canary, and local modes', () => {
    expect(getDeploymentConfig({ DEPLOYMENT_PROVIDER: 'vercel', DEPLOYMENT_ENVIRONMENT: 'production' })).toMatchObject({
      provider: 'vercel', environment: 'production', canary: false, runtime: 'vercel-functions',
    })
    expect(getDeploymentConfig({ DEPLOYMENT_PROVIDER: 'cloudflare', DEPLOYMENT_ENVIRONMENT: 'canary', PLATPHORM_CANARY: 'true' })).toMatchObject({
      provider: 'cloudflare', environment: 'canary', canary: true, runtime: 'cloudflare-workers',
    })
    expect(getDeploymentConfig({ DEPLOYMENT_PROVIDER: 'local' })).toMatchObject({
      provider: 'local', environment: 'development', appUrl: 'http://localhost:3000',
    })
  })

  it('keeps the production canonical URL and disables indexing in canary mode', () => {
    const policy = getSeoPolicy({
      DEPLOYMENT_PROVIDER: 'cloudflare',
      DEPLOYMENT_ENVIRONMENT: 'canary',
      PLATPHORM_CANARY: 'true',
      NEXT_PUBLIC_APP_URL: 'https://json.innovativefuturesolutions.com',
      NEXT_PUBLIC_CANONICAL_URL: 'https://json.platphormnews.com',
    })
    expect(policy).toEqual({
      canonicalUrl: 'https://json.platphormnews.com',
      index: false,
      follow: false,
      robotsHeader: 'noindex, nofollow, noarchive',
    })
  })

  it('renders Vercel Analytics only for the Vercel provider', () => {
    expect(shouldRenderVercelAnalytics({ DEPLOYMENT_PROVIDER: 'vercel' })).toBe(true)
    expect(shouldRenderVercelAnalytics({ DEPLOYMENT_PROVIDER: 'cloudflare' })).toBe(false)
    expect(shouldRenderVercelAnalytics({ DEPLOYMENT_PROVIDER: 'local' })).toBe(false)
  })

  it('returns a disallow-all robots policy in canary mode', async () => {
    vi.stubEnv('DEPLOYMENT_PROVIDER', 'cloudflare')
    vi.stubEnv('DEPLOYMENT_ENVIRONMENT', 'canary')
    vi.stubEnv('PLATPHORM_CANARY', 'true')
    const response = await robotsGet()
    expect(await response.text()).toBe('User-agent: *\nDisallow: /\n')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive')
  })

  it('captures Cloudflare metadata with a hashed, never raw, client IP', () => {
    vi.stubEnv('DEPLOYMENT_PROVIDER', 'cloudflare')
    vi.stubEnv('DEPLOYMENT_ENVIRONMENT', 'canary')
    vi.stubEnv('PLATPHORM_CANARY', 'true')
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.7',
      'cf-ray': 'example-ray',
      'cf-ipcountry': 'US',
      host: 'json.innovativefuturesolutions.com',
      'x-forwarded-proto': 'https',
    })
    const metadata = capturePlatformRequestMetadata(headers)
    expect(metadata).toMatchObject({ provider: 'cloudflare', runtime: 'cloudflare-workers', environment: 'canary', canary: true })
    expect(metadata.clientIpHash).toHaveLength(24)
    expect(JSON.stringify(metadata)).not.toContain('203.0.113.7')
  })

  it('prefers Cloudflare client IP and falls back to forwarded then real IP', () => {
    expect(getClientIP(new Request('https://example.com', { headers: { 'cf-connecting-ip': '198.51.100.1', 'x-forwarded-for': '198.51.100.2' } }))).toBe('198.51.100.1')
    expect(getClientIP(new Request('https://example.com', { headers: { 'x-forwarded-for': '198.51.100.2, 198.51.100.3' } }))).toBe('198.51.100.2')
    expect(getClientIP(new Request('https://example.com', { headers: { 'x-real-ip': '198.51.100.4' } }))).toBe('198.51.100.4')
  })
})
