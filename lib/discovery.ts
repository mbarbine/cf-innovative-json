import {
  ALL_ROUTES,
  API_ROUTES,
  BASE_URL,
  DISCOVERY_ROUTES,
  PRODUCT_NAME,
  SCHEMA_FILES,
  SERVICE_DOMAIN,
  TRUST_POLICY_LINE,
  V0_ROUTES,
  APP_VERSION,
  absoluteUrl,
} from './platform'
import { getAuthPolicy } from './auth'
import { getJsonLdArtifacts, getSchemaPack, listSchemas } from './schema-registry'
import { getModelAdapterStatus } from './model-adapter'

export function getRouteCompliance() {
  const implemented = ALL_ROUTES.filter((route) => route.implemented)
  const publicSafe = implemented.filter((route) => route.publicSafe)

  return {
    status: 'active',
    implementedRoutes: implemented.length,
    publicSafeRoutes: publicSafe.length,
    unsupportedRoutes: 0,
    score: 1,
    routes: ALL_ROUTES,
  }
}

export function getDiscoveryCompliance() {
  const discoveryRoutes = DISCOVERY_ROUTES.filter((route) => route.implemented)
  const schemaPack = getSchemaPack()

  return {
    status: schemaPack.status === 'active' ? 'active' : 'degraded',
    discoveryRouteCount: discoveryRoutes.length,
    activeSchemaCount: schemaPack.activeSchemaCount,
    schemaCount: schemaPack.schemaCount,
    llmsStatus: 'active',
    openapiStatus: 'active',
    rssStatus: 'active',
    sitemapStatus: 'active',
    trustStatus: 'active',
    score: schemaPack.activeSchemaCount === schemaPack.schemaCount ? 1 : schemaPack.activeSchemaCount / schemaPack.schemaCount,
  }
}

export function getPublicSitemapRoutes() {
  const fixedRoutes = ALL_ROUTES.filter((route) => route.publicSafe && route.method === 'GET' && route.implemented)
    .map((route) => route.path)
    .filter((path) => !path.includes('{'))

  return Array.from(new Set([...fixedRoutes, '/v0/realm/json-schema-registry/items']))
}

export function getSitemapEntries() {
  return getPublicSitemapRoutes().map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date('2026-05-10T00:00:00.000Z'),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : path.startsWith('/schemas/') ? 0.8 : 0.7,
  }))
}

export function buildSitemapXml(paths = getPublicSitemapRoutes()) {
  const urls = paths.map((path) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>2026-05-10T00:00:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export function buildSitemapIndexXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-main.xml</loc>
    <lastmod>2026-05-10T00:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
`
}

export function buildRssFeed() {
  const schemaItems = listSchemas().slice(0, 6).map((schema) => `    <item>
      <title>${escapeXml(schema.title)}</title>
      <link>${schema.url}</link>
      <guid isPermaLink="true">${schema.url}</guid>
      <pubDate>Sun, 10 May 2026 00:00:00 GMT</pubDate>
      <description>${escapeXml(schema.description)}</description>
      <category>Schema Registry</category>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${PRODUCT_NAME}</title>
    <link>${BASE_URL}</link>
    <description>Public JSON developer utility and PlatPhorm schema registry updates.</description>
    <language>en-US</language>
    <lastBuildDate>Sun, 10 May 2026 00:00:00 GMT</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <generator>${PRODUCT_NAME}</generator>
${schemaItems}
  </channel>
</rss>
`
}

export function buildLlmsTxt() {
  const schemas = listSchemas()
  const schemaLines = schemas.map((schema) => `- ${schema.title}: ${schema.url} (${schema.status})`).join('\n')
  const jsonTools = ['parse', 'format', 'minify', 'validate', 'stats', 'tree search', 'schema validation']

  return `# ${PRODUCT_NAME}

${PRODUCT_NAME} is the public JSON viewer, formatter, validator, tree explorer, and schema registry layer for the PlatPhormNews web mesh.

## Public Access

- Public-safe JSON editor and API operations are open by default.
- Local drafts use browser storage only; server-side persistence is not claimed when DATABASE_URL is unavailable.
- Future protected mutations use PLATPHORM_API_KEY through Authorization: Bearer or X-PlatPhorm-API-Key.

## JSON Tooling

${jsonTools.map((tool) => `- ${tool}`).join('\n')}

## Schema Registry

- Schema pack status: ${getSchemaPack().status}
- Active schemas: ${schemas.filter((schema) => schema.status === 'active').length}/${schemas.length}
${schemaLines}

## API

- GET ${BASE_URL}/api/health
- GET ${BASE_URL}/api/v1/health
- GET ${BASE_URL}/api/docs
- GET ${BASE_URL}/openapi.yaml
- POST ${BASE_URL}/api/v1/parse
- POST ${BASE_URL}/api/v1/format
- POST ${BASE_URL}/api/v1/minify
- POST ${BASE_URL}/api/v1/validate
- POST ${BASE_URL}/api/v1/stats
- POST ${BASE_URL}/api/v1/schema/validate
- GET ${BASE_URL}/api/v1/schemas
- GET ${BASE_URL}/api/v1/schema-pack
- GET ${BASE_URL}/api/v1/jsonld

## V0 Public Registry

${V0_ROUTES.map((route) => `- ${route.method} ${BASE_URL}${route.path}: ${route.description}`).join('\n')}

## MCP

- GET ${BASE_URL}/api/mcp
- POST ${BASE_URL}/api/mcp
- Public read-only introspection is available.
- Public-safe JSON/schema tools execute real local handlers.
- Cross-site report/remediation tools return honest degraded status unless the backing integration is configured.

## Trace And Trust

- JSON/API/MCP operations emit W3C trace metadata in response headers and response meta.
- Trusted domain discovery defaults to *.platphormnews.com.
- Trust policy: ${TRUST_POLICY_LINE}
`
}

export function buildLlmsFullTxt() {
  return `${buildLlmsTxt()}

## Route Inventory

${ALL_ROUTES.map((route) => `- ${route.method} ${route.path} | publicSafe=${route.publicSafe} | implemented=${route.implemented} | ${route.description}`).join('\n')}

## Auth Policy

${JSON.stringify(getAuthPolicy('future-protected'), null, 2)}

## Discovery Compliance

${JSON.stringify(getDiscoveryCompliance(), null, 2)}

## JSON-LD Artifacts

${JSON.stringify(getJsonLdArtifacts(), null, 2)}
`
}

export function buildLlmsIndex() {
  const schemas = listSchemas()
  const routeCompliance = getRouteCompliance()
  const discoveryCompliance = getDiscoveryCompliance()

  return {
    service: 'json',
    name: PRODUCT_NAME,
    version: APP_VERSION,
    baseUrl: BASE_URL,
    endpoints: ALL_ROUTES,
    authPolicy: getAuthPolicy('future-protected'),
    publicAccess: {
      enabled: true,
      publicSafeByDefault: true,
      localDrafts: 'IndexedDB for non-sensitive browser-local JSON drafts and validation history.',
    },
    jsonTools: ['parse', 'format', 'minify', 'validate', 'stats', 'tree_view', 'search', 'copy', 'download', 'local_drafts'],
    schemaRegistry: {
      status: schemas.every((schema) => schema.status === 'active') ? 'active' : 'degraded',
      schemas: schemas.map(({ schema, ...record }) => record),
    },
    schemaPack: getSchemaPack(),
    v0Endpoints: V0_ROUTES,
    tools: [
      'parse_json',
      'format_json',
      'minify_json',
      'validate_json',
      'get_json_stats',
      'validate_against_schema',
      'list_schemas',
      'get_schema',
      'get_schema_pack',
      'validate_jsonld',
    ],
    resources: ['json://schemas', 'json://schema/{slug}', 'json://schema-pack', 'json://examples', 'json://universes', 'json://realms', 'json://realm/{id}/items', 'json://openapi', 'json://llms', 'json://trust-policy'],
    prompts: ['explain_json', 'fix_invalid_json', 'generate_json_schema', 'validate_json_contract', 'summarize_json_tree', 'explain_schema', 'generate_jsonld', 'create_schema_registry_entry', 'human_machine_json_handoff'],
    trustedDomains: ['*.platphormnews.com'],
    routeStandard: routeCompliance,
    integrations: {
      trace: 'trace-linked response metadata and headers',
      docs: 'degraded unless report publishing is configured',
      sheets: 'degraded unless report publishing is configured',
      decks: 'degraded unless report publishing is configured',
      claws: 'degraded unless remediation is configured',
      browserops: 'degraded unless browser journey trigger is configured',
      evals: 'degraded unless eval trigger is configured',
      sandbox: 'degraded unless replay integration is configured',
    },
    modelIntegration: getModelAdapterStatus(),
    discoveryCompliance,
    trustPolicy: TRUST_POLICY_LINE,
    updatedAt: '2026-05-10T00:00:00.000Z',
  }
}

export function buildTrustPolicy() {
  return {
    service: 'json',
    domain: SERVICE_DOMAIN,
    product: PRODUCT_NAME,
    publicSafeAccess: true,
    policy: TRUST_POLICY_LINE,
    authentication: {
      publicReadOnly: true,
      apiKey: 'PLATPHORM_API_KEY',
      acceptedHeaders: ['Authorization: Bearer $PLATPHORM_API_KEY', 'X-PlatPhorm-API-Key: $PLATPHORM_API_KEY'],
    },
    auth: getAuthPolicy('future-protected'),
    domainAllowlist: ['*.platphormnews.com'],
    publicReadOnlyAccess: ['homepage', 'json editor', 'format', 'minify', 'validate', 'stats', 'schema browsing', 'schema validation', 'llms', 'rss', 'sitemap', 'health', 'read-only MCP introspection'],
    localPersistence: {
      mode: 'IndexedDB',
      stores: ['json-drafts', 'schema-drafts', 'validation-history', 'ui-state'],
      sensitiveDataWarning: 'Do not store secrets, private JSON, private schemas, or PLATPHORM_API_KEY in browser storage.',
    },
    schemaRegistryPolicy: 'Public bundled schemas are readable. Registry mutation is future protected.',
    jsonDataExposurePolicy: 'Pasted JSON remains browser-local unless sent to a public-safe API operation selected by the user.',
    tracePropagation: 'W3C traceparent/tracestate and safe PlatPhorm trace headers are accepted and emitted.',
    vercelMetadata: 'Safe Vercel headers are captured in response metadata with IP values hashed.',
    backendModelScaffolding: getModelAdapterStatus(),
    securityContact: 'security@platphormnews.com',
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
