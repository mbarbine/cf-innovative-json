# Evidence log

This file records nonsecret, redacted evidence. Never add API tokens, Worker secrets, full account identifiers, raw client IP addresses, OAuth URLs, or credential-bearing screenshots.

## Repository and local validation

| Check | Result |
| --- | --- |
| Source baseline | `69fdc6eb7b1dd8afcd1f1684d73303e90ec8c279` |
| Migration branch | `migration/cloudflare-json-canary` |
| Operator application reconciliation | merge commit `4bf814c` |
| Lint | Passed after final route inventory and documentation update |
| Typecheck | Passed after final route inventory and documentation update |
| Unit tests | 13 files, 83 tests passed |
| Next.js production build | Passed; 50 routes |
| OpenNext build | Passed |
| Wrangler dry-run bundle | 6,726.81 KiB upload; 1,352.70 KiB gzip; assets plus nonsecret variables only |
| Windows local workerd | Dynamic routes blocked by generated middleware-manifest resolution; static routes passed |
| Linux workerd | Pending GitHub Actions validation |

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
| Exact deployed commit | Pending |
| workers.dev URL/version | Pending |
| workers.dev smoke | Pending |
| Custom-domain DNS/TLS | Pending |
| Custom-domain smoke/parity | Pending |
| Canary noindex/robots | Pending |
| Deterministic WAF normal request | Pending |
| Deterministic WAF demo block | Pending |
| Production-safety comparison | Pending |
| Rollback rehearsal | Pending |
