'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileJson2, Info, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

type SchemaRecord = {
  slug: string
  title: string
  description: string
  status: string
  url: string
  path: string
}

type ValidationResult = {
  valid: boolean
  schemaSlug: string
  schemaTitle: string
  validator: string
  errors: Array<{ path: string; message: string; keyword: string }>
}

export function SchemaRegistryPanel({ rawJson, isValid }: { rawJson: string; isValid: boolean }) {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([])
  const [selectedSchema, setSelectedSchema] = useState('realm')
  const [status, setStatus] = useState<'loading' | 'ready' | 'degraded'>('loading')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [jsonLdStatus, setJsonLdStatus] = useState<'unknown' | 'available' | 'degraded'>('unknown')

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/v1/schemas').then((response) => response.json()),
      fetch('/api/v1/jsonld').then((response) => response.json()),
    ]).then(([schemaEnvelope, jsonLdEnvelope]) => {
      if (!active) return
      if (schemaEnvelope.ok) {
        setSchemas(schemaEnvelope.data)
        setStatus('ready')
      } else {
        setStatus('degraded')
      }
      setJsonLdStatus(jsonLdEnvelope.ok ? 'available' : 'degraded')
    }).catch(() => {
      if (!active) return
      setStatus('degraded')
      setJsonLdStatus('degraded')
    })

    return () => {
      active = false
    }
  }, [])

  const currentSchema = useMemo(
    () => schemas.find((schema) => schema.slug === selectedSchema),
    [schemas, selectedSchema],
  )

  async function validateAgainstSchema() {
    if (!isValid || !selectedSchema) return
    setValidating(true)
    setValidation(null)
    try {
      const response = await fetch('/api/v1/schema/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: rawJson, schemaSlug: selectedSchema }),
      })
      const envelope = await response.json()
      setValidation(envelope.ok ? envelope.data : { valid: false, schemaSlug: selectedSchema, schemaTitle: selectedSchema, validator: 'ajv-draft-2020-12', errors: [{ path: '$', message: envelope.error?.message || 'Validation failed.', keyword: envelope.error?.code || 'error' }] })
    } finally {
      setValidating(false)
    }
  }

  return (
    <TooltipProvider delayDuration={250}>
      <section className="border-t border-border bg-background/95 p-3" aria-labelledby="schema-registry-title">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="schema-registry-title" className="text-sm font-semibold">Schema Registry</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help" tabIndex={0}>
                    Public-safe
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Browsing and validation use public schema files. Registry mutation is future protected.</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={status === 'ready' ? 'default' : 'destructive'} className="cursor-help" tabIndex={0}>
                    {status === 'ready' ? 'Live files' : status}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Schema status is loaded from real public schema files under /schemas/json.</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Validate the current editor JSON against bundled PlatPhorm schemas.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="/api/v1/schema-pack" className="text-muted-foreground hover:text-foreground" aria-label="Open schema pack API">
                <FileJson2 className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>Open the public schema pack API response.</TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] mt-3">
          <Select value={selectedSchema} onValueChange={setSelectedSchema}>
            <SelectTrigger aria-label="Select schema for validation">
              <SelectValue placeholder="Select schema" />
            </SelectTrigger>
            <SelectContent>
              {schemas.map((schema) => (
                <SelectItem key={schema.slug} value={schema.slug}>
                  {schema.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={validateAgainstSchema} disabled={!isValid || validating || status !== 'ready'}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {validating ? 'Validating' : 'Validate'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isValid ? 'Validate current editor JSON against the selected public schema.' : 'Fix JSON syntax before schema validation.'}</TooltipContent>
          </Tooltip>
        </div>

        {currentSchema && (
          <div className="mt-3 text-xs text-muted-foreground">
            <a href={currentSchema.path} className="font-mono text-foreground hover:underline">
              {currentSchema.path}
            </a>
            <span className="block mt-1">{currentSchema.description}</span>
          </div>
        )}

        {validation && (
          <div className="mt-3 rounded-md border border-border bg-muted/20 p-3" role="status">
            <div className="flex items-center gap-2 text-sm font-medium">
              {validation.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
              {validation.valid ? 'Schema valid' : 'Schema issues found'}
            </div>
            {!validation.valid && (
              <ScrollArea className="max-h-24 mt-2">
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {validation.errors.map((error, index) => (
                    <li key={`${error.path}-${index}`}>
                      <code>{error.path}</code>: {error.message}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 cursor-help" tabIndex={0} aria-label="JSON-LD status" />
            </TooltipTrigger>
            <TooltipContent>JSON-LD artifacts are served from /api/v1/jsonld and validate through /api/v1/jsonld/validate.</TooltipContent>
          </Tooltip>
          <span>JSON-LD contract viewer: {jsonLdStatus === 'available' ? 'available' : jsonLdStatus}</span>
        </div>
      </section>
    </TooltipProvider>
  )
}
