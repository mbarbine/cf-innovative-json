# Route matrix

`lib/platform.ts` is the authoritative inventory for application, API, discovery, schema, MCP, v0, and protected cron routes. Discovery artifacts are generated from that inventory. Every implemented handler must be added there in the same change that introduces it.

| Surface | Methods | Expected canary behavior |
| --- | --- | --- |
| `/`, `/docs`, `/faq`, `/roadmap` | GET | 200; self-canonical and indexable when public discovery is enabled |
| `/api/health`, `/api/v1/health`, `/api/docs` | GET | 200 public health/OpenAPI envelopes |
| `/api/v1/parse`, `/format`, `/minify`, `/validate`, `/stats`, `/diff` | POST | Bounded public-safe JSON operations |
| `/api/v1/schema/validate`, `/schemas`, `/schemas/{slug}`, `/schema-pack` | GET/POST | Public schema registry and validation |
| `/api/v1/jsonld`, `/api/v1/jsonld/validate` | GET/POST | Public JSON-LD artifacts and validation |
| `/api/v1/fetch-url` | POST | Trusted-host, bounded server-side JSON fetch |
| `/api/mcp`, `/api/v1/mcp` | GET/POST | Public metadata and JSON-RPC tool discovery |
| `/api/mcp/sse` | GET | First event received, then client aborts within the smoke bound |
| `/api/mcp/register` | GET/POST | Public contract; protected scaffold does not mutate external state |
| `/api/cron/refresh` | POST | Protected boundary; unauthorized requests rejected |
| OpenAPI, LLM, robots, sitemap, feed, manifest, `.well-known` | GET | Public discovery with explicit AI-crawler allows and absolute canary sitemaps |
| `/schemas/json/*` | GET | Immutable public schema documents |
| `/v0/*` | GET | Existing public compatibility registry |
| `/favicon.ico`, `/opengraph-image` | GET | Asset response or bounded redirect |

The remote smoke suite exercises representative GET, POST, malformed-input, payload-limit, MCP, SSE, CORS, trace, public canonical/indexability, redirect-isolation, and normalized parity paths. It writes a machine-readable report under `.wrangler/`, which is ignored by Git.

## Validation matrix

| Gate | Local build | workers.dev | Custom domain |
| --- | --- | --- | --- |
| Next.js/OpenNext compilation | Passed | Passed in Cloudflare source build | Same deployed version |
| Public GET and discovery routes | Covered by unit/build validation | Passed | Passed |
| Representative JSON POST routes | Covered by unit validation | Passed | Passed |
| Schema validation | Precompiled AJV validators tested | Passed | Passed |
| MCP JSON-RPC and bounded SSE | Unit and route tests passed | Passed | Passed |
| Public indexability, canary canonical, robots | Unit tests passed | Passed | Passed, including Cloudflare content-signals prefix |
| Trace context and critical CORS | Unit tests passed | Passed | Passed |
| Normalized production parity | Not applicable | Passed | Passed |

The complete remote result is 31/31 on both hostnames. Windows local workerd remains blocked by OpenNext's generated middleware-manifest resolution on Windows. The deployed Linux Worker is the accepted runtime gate; the limitation is recorded rather than presented as a local pass.
