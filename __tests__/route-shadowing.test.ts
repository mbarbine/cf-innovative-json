import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

function routeHandlers(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return routeHandlers(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

describe('Next route ownership', () => {
  it('does not let public files shadow exact dynamic route handlers', () => {
    const collisions = routeHandlers(join(process.cwd(), 'app'))
      .map((handler) => relative(join(process.cwd(), 'app'), dirname(handler)))
      .filter((route) => route && !route.includes('['))
      .filter((route) => existsSync(join(process.cwd(), 'public', route)))
      .map((route) => `/${route.replaceAll('\\', '/')}`)

    expect(collisions).toEqual([])
    expect(existsSync(join(process.cwd(), 'public', 'sitemap.xml'))).toBe(false)
  })
})
