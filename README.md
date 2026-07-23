# JSON Tree + PlatPhorm Schema Registry

`cf-innovative-json` is the Cloudflare canary migration of the public JSON utility and schema registry at `json.platphormnews.com`. It formats, validates, searches, compares, and visualizes JSON while exposing public PlatPhorm schemas, discovery documents, and read-only MCP tools.

The canary is intentionally isolated:

- Worker: `platphorm-json-canary`
- Canary hostname: `json.innovativefuturesolutions.com`
- Public canonical: `json.innovativefuturesolutions.com`
- Deployment branch: `migration/cloudflare-json-canary`
- Automatic deployment source: `mbarbine/cf-innovative-json` only
- Default demonstration: a highlighted graph of the live Innovative Future Solutions security-control JSON

The production service is not modified or redirected by this repository. The demo canary opts into public discovery with `PLATPHORM_PUBLIC_DISCOVERY=true`; removing that variable restores the default noindex/disallow isolation policy.

Cloudflare Workers Builds listens only to the migration branch above. The original `mbarbine/platphorm-json` repository and the Innovative Future Solutions presentation repository are intentionally not connected to this demo Worker.

## Local validation

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm verify
```

`pnpm verify` runs lint, TypeScript checks, unit tests, the Next.js production build, and the OpenNext Cloudflare build.

## Cloudflare deployment

Cloudflare configuration is in `wrangler.jsonc`. Deployments use OpenNext and Wrangler with the base environment selected explicitly and existing remote variables preserved.

`PLATPHORM_API_KEY` is a Cloudflare Worker secret. Never add it to `wrangler.jsonc`, `.dev.vars`, logs, evidence files, or GitHub Actions output. Provision it interactively:

```powershell
pnpm exec wrangler secret put PLATPHORM_API_KEY --name platphorm-json-canary
```

See [the migration runbook](docs/cloudflare-migration/README.md) for gates, validation, AppSec, evidence, and rollback procedures.

