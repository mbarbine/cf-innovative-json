# Route matrix

`lib/platform.ts` is the authoritative inventory for application, API, discovery, schema, MCP, v0, and protected cron routes. Discovery artifacts are generated from that inventory. Every implemented handler must be added there in the same change that introduces it.

| Surface | Methods | Expected canary behavior |
| --- | --- | --- |
| `/`, `/docs`, `/faq`, `/roadmap` | GET | 200; production canonical; canary noindex |
| `/api/health`, `/api/v1/health`, `/api/docs` | GET | 200 public health/OpenAPI envelopes |
| `/api/v1/parse`, `/format`, `/minify`, `/validate`, `/stats`, `/diff` | POST | Bounded public-safe JSON operations |
| `/api/v1/schema/validate`, `/schemas`, `/schemas/{slug}`, `/schema-pack` | GET/POST | Public schema registry and validation |
| `/api/v1/jsonld`, `/api/v1/jsonld/validate` | GET/POST | Public JSON-LD artifacts and validation |
| `/api/v1/fetch-url` | POST | Trusted-host, bounded server-side JSON fetch |
| `/api/mcp`, `/api/v1/mcp` | GET/POST | Public metadata and JSON-RPC tool discovery |
| `/api/mcp/sse` | GET | First event received, then client aborts within the smoke bound |
| `/api/mcp/register` | GET/POST | Public contract; protected scaffold does not mutate external state |
| `/api/cron/refresh` | POST | Protected boundary; unauthorized requests rejected |
| OpenAPI, LLM, robots, sitemap, feed, manifest, `.well-known` | GET | Public discovery; canary robots disallow-all |
| `/schemas/json/*` | GET | Immutable public schema documents |
| `/v0/*` | GET | Existing public compatibility registry |
| `/favicon.ico`, `/opengraph-image` | GET | Asset response or bounded redirect |

The remote smoke suite exercises representative GET, POST, malformed-input, payload-limit, MCP, SSE, CORS, trace, canonical/noindex, redirect-isolation, and normalized parity paths. It writes a machine-readable report under `.wrangler/`, which is ignored by Git.
