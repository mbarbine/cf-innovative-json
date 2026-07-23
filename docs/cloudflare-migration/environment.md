# Environment and secrets

## Nonsecret Worker variables

| Variable | Canary value | Purpose |
| --- | --- | --- |
| `DEPLOYMENT_PROVIDER` | `cloudflare` | Select Worker runtime metadata |
| `DEPLOYMENT_ENVIRONMENT` | `canary` | Select canary behavior |
| `PLATPHORM_CANARY` | `true` | Preserve canary runtime identity and rollback separation |
| `PLATPHORM_PUBLIC_DISCOVERY` | `true` | Opt the demo hostname into indexing, self-canonical metadata, and explicit crawler access |
| `NEXT_PUBLIC_APP_URL` | `https://json.innovativefuturesolutions.com` | Public canary URL |
| `NEXT_PUBLIC_CANONICAL_URL` | `https://json.innovativefuturesolutions.com` | Publish the demo hostname as its own canonical URL |
| `PLATPHORM_TRACE_BASE_URL` | `https://trace.platphormnews.com` | Trace integration origin |
| `PLATPHORM_REQUIRE_API_KEY` | `false` | Keep Phase 1 public-safe operations open |

These values live in `wrangler.jsonc`. Deployment uses `--keep-vars` to avoid deleting remotely managed values.

## Secret

`PLATPHORM_API_KEY` must exist as a Cloudflare Worker secret even though Phase 1 public-safe operations do not require it. Set it through an interactive terminal so the value does not enter shell history, process arguments, logs, notes, or source control:

```powershell
pnpm exec wrangler secret put PLATPHORM_API_KEY --name platphorm-json-canary
```

Never place its value in `wrangler.jsonc`, `.dev.vars`, workflow YAML, Markdown, screenshots, smoke reports, or command-line arguments. GitHub deployment uses an environment-scoped secret of the same name only if protected operations are exercised in CI.

## Optional Cloudflare account credentials

Local Wrangler may use its OAuth session. GitHub Actions uses repository/environment secrets for the Cloudflare API token and account identifier. Neither value belongs in the repository or evidence artifacts.

Cloudflare Workers Builds uses the Git integration's managed deployment token. Its build environment should use the repository-pinned Node.js and pnpm versions. Build-only secrets are separate from runtime secrets; `PLATPHORM_API_KEY` belongs under the Worker's runtime Variables and Secrets, not the build environment.
