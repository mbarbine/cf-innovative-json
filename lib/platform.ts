export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com'
export const SERVICE_ID = 'json'
export const SERVICE_DOMAIN = 'json.platphormnews.com'
export const PRODUCT_NAME = 'JSON Tree + PlatPhorm Schema Registry'
export const PRODUCT_SHORT_NAME = 'JSON Tree'
export const APP_VERSION = '1.0.0'
export const PLATFORM_SOURCE_SITE = 'json'

export const TRUST_POLICY_LINE =
  'Public-safe JSON editing, formatting, validation, schema browsing, schema validation, local non-sensitive JSON draft persistence, read-only MCP introspection, RSS/feed consumption, trusted-domain discovery, standard route compliance, Vercel metadata capture, backend model scaffolding, and trace-linked JSON operations are intentionally supported for public use. PLATPHORM_API_KEY support is scaffolded for future protected backend services, registry mutation, private validation, sync, test-triggering, reporting, administrative actions, and sensitive operations.'

export type PlatformRoute = {
  path: string
  method: 'GET' | 'POST'
  publicSafe: boolean
  implemented: boolean
  description: string
  category: 'page' | 'api' | 'discovery' | 'schema' | 'mcp' | 'v0' | 'cron'
}

export type SchemaFile = {
  slug: string
  fileName: string
  path: string
  title: string
  description: string
  category: 'schema-pack' | 'core' | 'contract' | 'integration'
}

export const SCHEMA_FILES: SchemaFile[] = [
  {
    slug: 'platphorm-universal-schema-pack',
    fileName: 'platphorm-universal-schema-pack.json',
    path: '/schemas/json/platphorm-universal-schema-pack.json',
    title: 'PlatPhorm Universal Schema Pack',
    description: 'The bundled public schema pack for PlatPhorm network contracts.',
    category: 'schema-pack',
  },
  {
    slug: 'core',
    fileName: 'core.schema.json',
    path: '/schemas/json/core.schema.json',
    title: 'Core Schema',
    description: 'Core enums and defaults shared by PlatPhorm schema contracts.',
    category: 'core',
  },
  {
    slug: 'realm',
    fileName: 'realm.schema.json',
    path: '/schemas/json/realm.schema.json',
    title: 'Realm Schema',
    description: 'Public contract for PlatPhorm realms and sites.',
    category: 'contract',
  },
  {
    slug: 'item',
    fileName: 'item.schema.json',
    path: '/schemas/json/item.schema.json',
    title: 'Item Schema',
    description: 'Public contract for PlatPhorm content and operational items.',
    category: 'contract',
  },
  {
    slug: 'observability',
    fileName: 'observability.schema.json',
    path: '/schemas/json/observability.schema.json',
    title: 'Observability Schema',
    description: 'Trace, span, and observability contract schema.',
    category: 'integration',
  },
  {
    slug: 'agent',
    fileName: 'agent.schema.json',
    path: '/schemas/json/agent.schema.json',
    title: 'Agent Schema',
    description: 'Agent run and human-machine handoff contract schema.',
    category: 'integration',
  },
]

export const PAGE_ROUTES: PlatformRoute[] = [
  { path: '/', method: 'GET', publicSafe: true, implemented: true, category: 'page', description: 'Public JSON editor, tree viewer, formatter, validator, and schema registry surface.' },
  { path: '/docs', method: 'GET', publicSafe: true, implemented: true, category: 'page', description: 'Human API and MCP documentation.' },
  { path: '/faq', method: 'GET', publicSafe: true, implemented: true, category: 'page', description: 'Public FAQ for JSON Tree and schema registry usage.' },
  { path: '/roadmap', method: 'GET', publicSafe: true, implemented: true, category: 'page', description: 'Public roadmap.' },
]

export const API_ROUTES: PlatformRoute[] = [
  { path: '/api/health', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'Standard public-safe health summary.' },
  { path: '/api/v1/health', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'Versioned health summary.' },
  { path: '/api/docs', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'OpenAPI 3.1 JSON document.' },
  { path: '/api/v1/parse', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Parse JSON into tree state and stats.' },
  { path: '/api/v1/format', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Format valid JSON.' },
  { path: '/api/v1/minify', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Minify valid JSON.' },
  { path: '/api/v1/validate', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Validate JSON syntax.' },
  { path: '/api/v1/stats', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Calculate JSON node and type statistics.' },
  { path: '/api/v1/schema/validate', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Validate JSON against a public schema.' },
  { path: '/api/v1/schemas', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'List public registry schemas.' },
  { path: '/api/v1/schemas/{slug}', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'Read one public registry schema.' },
  { path: '/api/v1/schema-pack', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'Read schema pack metadata and files.' },
  { path: '/api/v1/jsonld', method: 'GET', publicSafe: true, implemented: true, category: 'api', description: 'Read JSON-LD structured data artifacts.' },
  { path: '/api/v1/jsonld/validate', method: 'POST', publicSafe: true, implemented: true, category: 'api', description: 'Validate JSON-LD structure locally.' },
  { path: '/api/cron/refresh', method: 'POST', publicSafe: false, implemented: true, category: 'cron', description: 'Bounded metadata refresh for Vercel cron or PLATPHORM_API_KEY.' },
]

export const DISCOVERY_ROUTES: PlatformRoute[] = [
  { path: '/openapi.yaml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'OpenAPI 3.1 YAML document.' },
  { path: '/openapi.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'OpenAPI 3.1 JSON document.' },
  { path: '/llms.txt', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Readable compact LLM discovery guide.' },
  { path: '/llms-full.txt', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Full LLM discovery guide.' },
  { path: '/llms-index.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Machine-readable LLM discovery index.' },
  { path: '/robots.txt', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Robots policy with canonical sitemap links.' },
  { path: '/sitemap.xml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Public-safe sitemap.' },
  { path: '/sitemap-main.xml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Main public page and schema sitemap.' },
  { path: '/sitemap-index.xml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Sitemap index.' },
  { path: '/rss.xml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Public-safe RSS feed.' },
  { path: '/feed.xml', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Public-safe RSS feed alias.' },
  { path: '/manifest.webmanifest', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Web app manifest.' },
  { path: '/.well-known/mcp.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'MCP discovery metadata.' },
  { path: '/.well-known/agents.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Agent discovery metadata.' },
  { path: '/.well-known/ai-plugin.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'AI plugin discovery metadata.' },
  { path: '/.well-known/security.txt', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Security contact policy.' },
  { path: '/.well-known/trust.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'Trust and data exposure policy.' },
  { path: '/.well-known/platphorm.json', method: 'GET', publicSafe: true, implemented: true, category: 'discovery', description: 'PlatPhorm realm manifest.' },
]

export const V0_ROUTES: PlatformRoute[] = [
  { path: '/v0/universes', method: 'GET', publicSafe: true, implemented: true, category: 'v0', description: 'List public universes exposed by the JSON schema registry.' },
  { path: '/v0/realms', method: 'GET', publicSafe: true, implemented: true, category: 'v0', description: 'List public realms exposed by the JSON schema registry.' },
  { path: '/v0/realm/{id}/items', method: 'GET', publicSafe: true, implemented: true, category: 'v0', description: 'List public schema items for a realm.' },
]

export const SCHEMA_ROUTES: PlatformRoute[] = SCHEMA_FILES.map((schema) => ({
  path: schema.path,
  method: 'GET',
  publicSafe: true,
  implemented: true,
  category: 'schema',
  description: schema.description,
}))

export const MCP_ROUTE: PlatformRoute = {
  path: '/api/mcp',
  method: 'POST',
  publicSafe: true,
  implemented: true,
  category: 'mcp',
  description: 'JSON-RPC 2.0 MCP endpoint for public-safe JSON and schema tooling.',
}

export const ALL_ROUTES: PlatformRoute[] = [
  ...PAGE_ROUTES,
  ...API_ROUTES,
  ...DISCOVERY_ROUTES,
  ...SCHEMA_ROUTES,
  ...V0_ROUTES,
  { ...MCP_ROUTE, method: 'GET', description: 'Read-only MCP metadata and usage.' },
  MCP_ROUTE,
]

export function absoluteUrl(path: string): string {
  if (path === '/') return BASE_URL
  return `${BASE_URL}${path}`
}

export function findSchemaBySlug(slug: string): SchemaFile | undefined {
  const normalized = slug
    .replace(/^\/?schemas\/json\//, '')
    .replace(/\.schema\.json$/, '')
    .replace(/\.json$/, '')

  return SCHEMA_FILES.find(
    (schema) =>
      schema.slug === normalized ||
      schema.fileName === slug ||
      schema.fileName === `${normalized}.schema.json` ||
      schema.fileName === `${normalized}.json`,
  )
}
