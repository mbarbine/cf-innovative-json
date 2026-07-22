# Runtime audit

## Runtime model

The canary is a Next.js application packaged by OpenNext for Cloudflare Workers. `cloudflare/worker.ts` wraps the generated Worker only to add provider-neutral request timing and enforce the canary `X-Robots-Tag` header. `nodejs_compat` supports the bounded Node APIs used by the application.

There is no Next.js middleware or proxy in the canary. The Windows local `workerd` failure referencing a missing `middleware-manifest.json` occurs inside the OpenNext-generated dynamic-route runtime; Linux GitHub Actions is the authoritative compatibility gate.

## State and storage

No D1, KV, R2, Hyperdrive, Durable Object, Queue, Vectorize, Pipeline, or Analytics Engine binding is configured. None is required to solve the OpenNext middleware-manifest issue.

The existing application-level `Map` rate limiter is isolate-local and therefore not a globally consistent security boundary. Canary abuse protection belongs in Cloudflare Rate Limiting/WAF. A Durable Object would be appropriate only if the product later requires strongly consistent application-owned counters. Storage must not be added without a concrete data-lifecycle, access-control, test, and rollback requirement.

## Network and data controls

- The default security-controls feed is fetched server-side from one fixed HTTPS endpoint with a five-second timeout, JSON-envelope validation, a 256-KiB limit, and a safe fallback.
- User-selected remote JSON is restricted to trusted HTTPS PlatPhorm hosts, rejects credentialed URLs and unsafe redirects, enforces response size limits, and validates JSON before returning it.
- Trace export is bounded by a short timeout and hashes client network identifiers rather than retaining raw addresses.
- Public API payload parsing is bounded at the application layer; Cloudflare perimeter limits remain a separate control.
- Canary discovery retains the production canonical identity and disables indexing.

## Compatibility disposition

| Concern | Disposition |
| --- | --- |
| Middleware/proxy | Removed from the canary; wrapper headers are used instead |
| Dynamic Next routes | Must pass Ubuntu `workerd` smoke before deployment |
| Node crypto | Supported through `nodejs_compat` |
| Filesystem persistence | Not used for runtime state |
| In-memory rate limits | Best-effort only; not a perimeter guarantee |
| SSE | Smoke test reads the first event and performs a bounded abort |
| Secrets | Wrangler secret only; never a plaintext variable |
| Storage bindings | None |
