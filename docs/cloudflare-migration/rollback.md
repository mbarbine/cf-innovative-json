# Rollback

## Worker code rollback

1. List deployments for `platphorm-json-canary` and identify the previously verified version.
2. Roll back only that Worker using Wrangler's reviewed deployment identifier.
3. Rerun the workers.dev smoke suite and capture the result.

The previous known-good version retained during validation was `21b84b17…`. Confirm it is still listed before using it:

```powershell
pnpm exec wrangler deployments list --name platphorm-json-canary
pnpm exec wrangler rollback <full-verified-version-id> --name platphorm-json-canary -m "Rollback JSON canary" --yes
```

Never roll back or redeploy the production `json.platphormnews.com` project as part of this canary procedure.

## Custom-domain rollback

Detach only the `json.innovativefuturesolutions.com` custom domain from `platphorm-json-canary`. Preview the trigger reconciliation, then apply the base environment with no custom-domain route:

```powershell
pnpm exec wrangler triggers deploy --env="" --name platphorm-json-canary --dry-run
pnpm exec wrangler triggers deploy --env="" --name platphorm-json-canary
```

Recheck DNS and certificate state after detachment. Do not delete or modify any broader zone record by inference.

## AppSec rollback

Dry-run removal first, then delete only the rule with stable ref `platphorm_json_canary_demo_block_v1`:

```powershell
node scripts/cloudflare/configure-json-canary-security.mjs --remove
node scripts/cloudflare/configure-json-canary-security.mjs --apply --remove
```

The generated `.wrangler/json-canary-appsec-rollback.md` file is local evidence and is not committed.

## Secret rollback

Rotate or delete only the `PLATPHORM_API_KEY` secret bound to `platphorm-json-canary` if the canary is retired. Never print the value during verification.

## Rollback success criteria

- workers.dev returns the selected previous version or is intentionally disabled;
- the custom hostname no longer routes to the canary if detachment was requested;
- the owned WAF rule is absent;
- production DNS, HTTP behavior, and deployment identity remain unchanged.
