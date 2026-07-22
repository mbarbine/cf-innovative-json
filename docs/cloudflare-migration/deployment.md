# Deployment

## Read-only preflight

Before the first mutation, verify:

- the authenticated account is the intended account;
- exactly one active `innovativefuturesolutions.com` zone exists;
- `json.innovativefuturesolutions.com` has no conflicting DNS record, Worker route/custom domain, Pages domain, Access application, redirect, or certificate ownership;
- Worker name `platphorm-json-canary` is absent or already owned by this migration;
- compressed bundle size is within the account plan limit.

Stop on ambiguity. Record redacted results in `evidence.md`.

## Build and workers.dev gate

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm verify
pnpm exec wrangler deploy --env="" --dry-run --outdir .wrangler/dry-run --keep-vars
pnpm exec wrangler secret put PLATPHORM_API_KEY --name platphorm-json-canary
pnpm cf:deploy
```

Capture the exact Git commit, Wrangler deployment identifier, version identifier, deployment URL, and compressed size without recording credentials or full account identifiers.

Run:

```powershell
$env:CLOUDFLARE_CANARY_URL='https://<generated-worker-subdomain>'
$env:SMOKE_REPORT_PATH='.wrangler/workers-dev-smoke-report.json'
pnpm smoke:cloudflare
```

Do not attach the custom domain until every workers.dev smoke check passes and Linux CI is green.

## Custom-domain gate

The `custom-domain` Wrangler environment contains only the exact reviewed hostname. After repeating the conflict preflight:

```powershell
pnpm exec wrangler triggers deploy --env custom-domain --name platphorm-json-canary
```

Then verify DNS, TLS, certificate hostname, no redirects, noindex headers and metadata, robots disallow-all, route smoke, normalized parity, and production isolation.

## CI workflow

`.github/workflows/cloudflare-canary-deploy.yml` requires an exact reviewed commit, an exact hostname confirmation, and an explicit boolean before attaching the custom domain. It retains the previous deployment record for rollback and publishes only a redacted summary.
