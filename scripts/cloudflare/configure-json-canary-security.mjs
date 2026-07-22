import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const API = 'https://api.cloudflare.com/client/v4'
const ZONE_NAME = 'innovativefuturesolutions.com'
const HOSTNAME = 'json.innovativefuturesolutions.com'
const RULE_REF = 'platphorm_json_canary_demo_block_v1'
const RULE_DESCRIPTION = 'PlatPhorm JSON canary — deterministic demo block'
const RULE_EXPRESSION = '(http.host eq "json.innovativefuturesolutions.com" and any(http.request.headers["x-platphorm-security-demo"][*] eq "block"))'
const token = process.env.CLOUDFLARE_API_TOKEN || ''
const apply = process.argv.includes('--apply')
const remove = process.argv.includes('--remove')
const rollbackPath = process.env.APPSEC_ROLLBACK_PATH || '.wrangler/json-canary-appsec-rollback.md'

if (!token) {
  console.error('Missing CLOUDFLARE_API_TOKEN. No Cloudflare request was made.')
  process.exit(2)
}
if (remove && !apply) {
  console.error('--remove is a mutation and requires --apply.')
  process.exit(2)
}

async function api(path, options = {}, allowNotFound = false) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({ success: false, errors: [{ message: 'Non-JSON Cloudflare response' }] }))
  if (allowNotFound && response.status === 404) return null
  if (!response.ok || body.success === false) {
    const messages = (body.errors || []).map((error) => error.message || error.code).filter(Boolean).join('; ')
    throw new Error(`Cloudflare API ${response.status}: ${messages || 'request failed'}`)
  }
  return body.result
}

async function optionalRead(path) {
  try {
    const result = await api(path, {}, true)
    return { readable: result !== null, present: result !== null }
  } catch (error) {
    return { readable: false, present: null, reason: error instanceof Error ? error.message : String(error) }
  }
}

const zones = await api(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`)
if (!Array.isArray(zones) || zones.length !== 1 || zones[0].name !== ZONE_NAME) {
  throw new Error(`Expected exactly one active ${ZONE_NAME} zone; refusing to continue.`)
}
const zoneId = zones[0].id
const phasePath = `/zones/${zoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`
const ruleset = await api(phasePath, {}, true)
const ownedRules = (ruleset?.rules || []).filter((rule) => rule.ref === RULE_REF)
if (ownedRules.length > 1) throw new Error(`Multiple rules use owned ref ${RULE_REF}; refusing to reconcile ambiguous state.`)

const desiredRule = {
  action: 'block',
  expression: RULE_EXPRESSION,
  description: RULE_DESCRIPTION,
  ref: RULE_REF,
  enabled: true,
}
const existing = ownedRules[0] || null
const matches = existing && existing.action === desiredRule.action && existing.expression === desiredRule.expression && existing.description === desiredRule.description && existing.enabled !== false
let plannedAction = remove ? (existing ? 'delete-owned-rule' : 'noop') : !ruleset ? 'create-entrypoint-with-owned-rule' : !existing ? 'add-owned-rule' : matches ? 'noop' : 'update-owned-rule'
let appliedRule = existing

if (apply && plannedAction !== 'noop') {
  if (plannedAction === 'create-entrypoint-with-owned-rule') {
    const created = await api(`/zones/${zoneId}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'zone',
        description: 'Zone-level phase entry point',
        kind: 'zone',
        phase: 'http_request_firewall_custom',
        rules: [desiredRule],
      }),
    })
    appliedRule = created.rules?.find((rule) => rule.ref === RULE_REF) || null
  } else if (plannedAction === 'add-owned-rule') {
    const updated = await api(`/zones/${zoneId}/rulesets/${ruleset.id}/rules`, {
      method: 'POST', body: JSON.stringify(desiredRule),
    })
    appliedRule = updated.rules?.find((rule) => rule.ref === RULE_REF) || null
  } else if (plannedAction === 'update-owned-rule') {
    const updated = await api(`/zones/${zoneId}/rulesets/${ruleset.id}/rules/${existing.id}`, {
      method: 'PATCH', body: JSON.stringify(desiredRule),
    })
    appliedRule = updated.rules?.find((rule) => rule.ref === RULE_REF) || null
  } else if (plannedAction === 'delete-owned-rule') {
    await api(`/zones/${zoneId}/rulesets/${ruleset.id}/rules/${existing.id}`, { method: 'DELETE' })
    appliedRule = null
  }
}

const [rateLimit, managedRules, botManagement] = await Promise.all([
  optionalRead(`/zones/${zoneId}/rulesets/phases/http_ratelimit/entrypoint`),
  optionalRead(`/zones/${zoneId}/rulesets/phases/http_request_firewall_managed/entrypoint`),
  optionalRead(`/zones/${zoneId}/bot_management`),
])

const report = {
  mode: apply ? 'apply' : 'dry-run',
  zone: ZONE_NAME,
  hostname: HOSTNAME,
  phase: 'http_request_firewall_custom',
  rule: {
    ref: RULE_REF,
    description: RULE_DESCRIPTION,
    expression: RULE_EXPRESSION,
    action: 'block',
    existing: Boolean(existing),
    id: appliedRule?.id || existing?.id || null,
  },
  plannedAction,
  mutationPerformed: apply && plannedAction !== 'noop',
  rateLimiting: { ...rateLimit, mutationPlanned: false, note: 'Read-only entitlement/state check; no rate-limit rule is applied by this script.' },
  managedRules: { ...managedRules, mutationPlanned: false },
  botManagement: { ...botManagement, mutationPlanned: false },
  generatedAt: new Date().toISOString(),
}

mkdirSync(dirname(rollbackPath), { recursive: true })
writeFileSync(rollbackPath, `# PlatPhorm JSON canary AppSec rollback\n\nGenerated: ${report.generatedAt}\n\nOwned rule ref: \`${RULE_REF}\`\n\nDry-run removal:\n\n\`\`\`powershell\nnode scripts/cloudflare/configure-json-canary-security.mjs --remove\n\`\`\`\n\nAuthorized removal:\n\n\`\`\`powershell\nnode scripts/cloudflare/configure-json-canary-security.mjs --apply --remove\n\`\`\`\n\nThe script resolves the exact zone by name and deletes only the rule with the owned stable ref.\n`, { encoding: 'utf8', mode: 0o600 })
console.log(JSON.stringify(report, null, 2))
