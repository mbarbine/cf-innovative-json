import { createTraceContext } from './trace'

export type ModelTask =
  | 'explain_json_structure'
  | 'suggest_schema'
  | 'explain_validation_errors'
  | 'generate_json_schema'
  | 'jsonld_hints'
  | 'summarize_large_json'
  | 'suggest_field_names'
  | 'detect_data_type_issues'
  | 'create_docs_from_schema'

export type ModelAdapterStatus = {
  status: 'available' | 'degraded'
  provider: 'vercel-ai-sdk-compatible' | 'unconfigured'
  gatewayConfigured: boolean
  reason: string
  supportedTasks: ModelTask[]
  traceId: string
  traceUrl: string
}

export const MODEL_TASKS: ModelTask[] = [
  'explain_json_structure',
  'suggest_schema',
  'explain_validation_errors',
  'generate_json_schema',
  'jsonld_hints',
  'summarize_large_json',
  'suggest_field_names',
  'detect_data_type_issues',
  'create_docs_from_schema',
]

export function getModelAdapterStatus(headers?: Headers): ModelAdapterStatus {
  const trace = createTraceContext(headers, 'model_adapter_status')
  const hasProvider = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY)

  return {
    status: hasProvider ? 'available' : 'degraded',
    provider: hasProvider ? 'vercel-ai-sdk-compatible' : 'unconfigured',
    gatewayConfigured: Boolean(process.env.AI_GATEWAY_API_KEY),
    reason: hasProvider
      ? 'A backend model provider is configured. Client-side model calls remain disabled.'
      : 'No backend model provider is configured. JSON explanation and schema generation return degraded status instead of fake output.',
    supportedTasks: MODEL_TASKS,
    traceId: trace.traceId,
    traceUrl: trace.traceUrl,
  }
}

export function degradedModelResult(task: ModelTask, headers?: Headers) {
  const status = getModelAdapterStatus(headers)

  return {
    ok: false,
    task,
    status: status.status,
    provider: status.provider,
    message: status.reason,
    traceId: status.traceId,
    traceUrl: status.traceUrl,
  }
}
