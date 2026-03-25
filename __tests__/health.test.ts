import { describe, it, expect } from 'vitest'
import { GET } from '../app/api/health/route'

describe('/api/health Endpoint', () => {
  it('should return 200 and standard health data', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('status', 'active')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('uptime')
    expect(data).toHaveProperty('memory')
    expect(data).toHaveProperty('nodeVersion')
    expect(data).toHaveProperty('realm')
    expect(data).toHaveProperty('capabilities')
  })
})
