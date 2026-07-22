# Application security

## Owned deterministic demonstration rule

The migration owns one custom WAF rule only:

- Stable ref: `platphorm_json_canary_demo_block_v1`
- Host scope: `json.innovativefuturesolutions.com`
- Action: block
- Expression: `(http.host eq "json.innovativefuturesolutions.com" and any(http.request.headers["x-platphorm-security-demo"][*] eq "block"))`

Normal requests must remain allowed. A request containing `X-PlatPhorm-Security-Demo: block` provides a deterministic presentation-safe block demonstration.

## Change procedure

`scripts/cloudflare/configure-json-canary-security.mjs` defaults to read-only planning. It resolves exactly one active zone, reconciles only the stable ref, stops on duplicate ownership, and reports rate-limit, managed-rule, and bot-management readability without mutating those products.

```powershell
node scripts/cloudflare/configure-json-canary-security.mjs
node scripts/cloudflare/configure-json-canary-security.mjs --apply
```

The script needs a Cloudflare API token from the process environment. Inject it through a secure operator-controlled environment; never paste it into a command, file, report, or transcript.

Rate limiting is not applied automatically. Add a rule only after entitlement is verified and a separately reviewed dry-run specifies expression, threshold, period, mitigation timeout, affected routes, and rollback. Do not alter zone-wide managed rules, bot settings, DDoS controls, Access policies, or unrelated WAF rules.

## Verification

1. Confirm a normal request returns the application response.
2. Confirm the exact demo header returns a Cloudflare block response.
3. Confirm the same header on any other hostname is unaffected.
4. Confirm production `json.platphormnews.com` behavior and DNS remain unchanged.
5. Record rule ref, redacted rule identifier, test timestamps, and rollback command.
