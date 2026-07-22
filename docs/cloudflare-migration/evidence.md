# Evidence log

This file records nonsecret, redacted evidence. Never add API tokens, Worker secrets, full account identifiers, raw client IP addresses, OAuth URLs, or credential-bearing screenshots.

## Repository and local validation

| Check | Result |
| --- | --- |
| Source baseline | `69fdc6eb7b1dd8afcd1f1684d73303e90ec8c279` |
| Migration branch | `migration/cloudflare-json-canary` |
| Operator application reconciliation | merge commit `4bf814c` |
| Validated runtime checkpoint | `0ff930f` (exact-route static-shadow removal) |
| Lint | Passed after the final route and smoke-harness updates |
| Typecheck | Passed after the final route and smoke-harness updates |
| Unit tests | 14 files, 84 tests passed |
| Next.js production build | Passed; 50 routes |
| OpenNext build | Passed |
| Cloudflare source-build bundle | 6,122.71 KiB upload; 1,217.63 KiB gzip; 27 ms startup |
| Windows local workerd | Dynamic routes blocked by generated middleware-manifest resolution; static routes passed |
| Linux Cloudflare build/runtime | Source build and deployed Worker passed; local Linux workerd remained unavailable because the WSL distribution had no usable Node/DNS bootstrap path |

## Cloudflare control plane

| Check | Result |
| --- | --- |
| Wrangler authentication | OAuth authenticated; account identifier redacted |
| Active zone uniqueness | Exactly one active intended zone confirmed in the authenticated account |
| Exact DNS hostname conflict | No A, AAAA, CNAME, or Worker DNS record for the canary hostname; public DNS is NXDOMAIN |
| Worker route/custom-domain conflict | Zone has no Worker routes; the exact hostname is absent from the DNS/custom-domain inventory |
| Pages domain conflict | Account Pages project list is empty |
| Access application conflict | Access is not configured for the zone |
| Certificate/redirect conflict | No exact-host certificate/custom-hostname entry and no Redirect Rules; universal certificate is active |
| Worker name ownership | Worker does not exist in the authenticated account |
| Plan size entitlement | Workers Free 3 MiB gzip limit; bundle is 1,352.70 KiB ([current limits](https://developers.cloudflare.com/workers/platform/limits/)) |

## Deployment and AppSec

| Check | Result |
| --- | --- |
| Workers Builds source | `mbarbine/cf-innovative-json`, branch `migration/cloudflare-json-canary`; automatic source connection active only for this branch |
| Runtime secret | `PLATPHORM_API_KEY` stored as a Worker secret; value never logged or committed |
| Validated deployment | Runtime checkpoint `0ff930f`; Worker version `8e08990a…` |
| workers.dev URL | `https://platphorm-json-canary.barbine-michael.workers.dev` |
| workers.dev smoke | 29/29 passed at 2026-07-22T23:39Z |
| Custom-domain DNS/TLS | Two independent public resolvers returned the Cloudflare addresses; certificate validation result 0; HTTP 200 |
| Custom-domain smoke/parity | 29/29 passed at 2026-07-22T23:41Z using the exact hostname and TLS SNI through a temporary local DNS-pin proxy because the Windows resolver retained an earlier NXDOMAIN answer |
| Canary noindex/robots | `X-Robots-Tag`, HTML robots metadata, production canonical, and terminal disallow-all robots group verified |
| Deterministic WAF normal request | HTTP 200 at 2026-07-22T23:42Z |
| Deterministic WAF demo block | HTTP 403 at 2026-07-22T23:42Z; owned rule ref `platphorm_json_canary_demo_block_v1`, rule ID `14d1fb09…` |
| Production-safety comparison | Production returned HTTP 200 with and without the canary demo marker and did not redirect to the canary |
| Rollback viability | Previous known-good Worker version `21b84b17…` retained; installed Wrangler rollback and trigger command families verified; rollback was intentionally not performed after success |
