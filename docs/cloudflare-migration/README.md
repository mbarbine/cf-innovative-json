# Cloudflare canary migration

This runbook governs the parallel Cloudflare canary for JSON Tree + PlatPhorm Schema Registry.

## Immutable boundaries

- Do not edit, redirect, detach, or redeploy `json.platphormnews.com`.
- Deploy only Worker `platphorm-json-canary` from branch `migration/cloudflare-json-canary`.
- Validate the generated `workers.dev` deployment before attaching `json.innovativefuturesolutions.com`.
- Keep the canary non-indexable and preserve `https://json.platphormnews.com` as canonical.
- Preserve existing Cloudflare variables with `--keep-vars`.
- Store `PLATPHORM_API_KEY` only as a Wrangler secret.
- Stop on any account, zone, hostname, route, Access, Pages, certificate, or redirect ownership ambiguity.

## Gate order

1. Verify the baseline and review the [runtime audit](audit.md).
2. Run the full local and Linux CI validation suite.
3. Perform read-only Cloudflare control-plane conflict checks.
4. Build once, deploy to `workers.dev`, and capture the deployment version.
5. Run the full smoke suite and parity comparison.
6. Attach only the exact canary custom domain.
7. Run DNS, TLS, SEO, route, and production-safety checks.
8. Dry-run and then apply only the owned deterministic AppSec rule.
9. Update the presentation only from verified live canary evidence.

## Documents

- [Baseline](baseline.md)
- [Runtime audit](audit.md)
- [Route matrix](route-matrix.md)
- [Environment and secrets](environment.md)
- [Deployment](deployment.md)
- [Application security](appsec.md)
- [Rollback](rollback.md)
- [Evidence log](evidence.md)
