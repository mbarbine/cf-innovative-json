import { describe, it, expect } from 'vitest'
import { GET } from '../app/api/health/route'

describe('/api/health Endpoint', () => {
  it('should return 200 and standard health data', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('ok', true)
    expect(data.data).toHaveProperty('service', 'json')
    expect(data.data).toHaveProperty('product', 'JSON Tree + PlatPhorm Schema Registry')
    expect(data.data).toHaveProperty('status')
    expect(data.data).toHaveProperty('uptime')
    expect(data.data).toHaveProperty('routeCompliance')
    expect(data.data).toHaveProperty('discoveryCompliance')
    expect(data.data.auth.keyName).toBe('PLATPHORM_API_KEY')
    expect(data.meta).toHaveProperty('traceId')
    expect(response.headers.get('X-PlatPhorm-Trace-Export')).toBe('suppressed')
  })
})
