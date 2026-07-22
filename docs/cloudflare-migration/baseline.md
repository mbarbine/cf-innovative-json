# Baseline

## Repositories

| Role | Repository | Reference |
| --- | --- | --- |
| Original production source | `mbarbine/platphorm-json` | `69fdc6eb7b1dd8afcd1f1684d73303e90ec8c279` |
| Cloudflare canary | `mbarbine/cf-innovative-json` | branch `migration/cloudflare-json-canary` |
| Operator-published application reconciled from `main` | `mbarbine/cf-innovative-json` | `2f13213165df96ba37de6d1d7e75d6aeacbe6e17` |

The original checkout was inspected but not modified. The operator-published application was merged into the migration branch without rewriting `main`.

## Toolchain and baseline results

- Node.js 24.15.0
- pnpm 10.33.2
- Next.js 16.2.11
- OpenNext Cloudflare 1.20.2
- Wrangler 4.113.0
- ESLint was aligned to 9.39.5 for compatibility with the Next.js lint configuration.

Validated locally after reconciliation:

- ESLint: pass
- TypeScript: pass
- Vitest: 13 files and 83 tests passed after the route-inventory expansion
- Next.js production build: pass, 50 generated routes
- OpenNext build: pass
- Wrangler dry run: 6,726.81 KiB uploaded, 1,352.70 KiB compressed, no storage bindings

All final local checks passed on 2026-07-22; Linux `workerd` remains the CI authority.
