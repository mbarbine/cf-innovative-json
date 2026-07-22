import fs from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { BASE_URL, SCHEMA_FILES, findSchemaBySlug, type SchemaFile } from './platform'
import { validateJsonString } from './api-utils'

export type JsonSchemaRecord = {
  id: string
  slug: string
  title: string
  description: string
  schema: unknown | null
  version: string
  status: 'active' | 'unavailable' | 'degraded'
  source: 'public-file'
  url: string
  path: string
  traceId: string | null
  createdAt: string
  updatedAt: string
  metadata: {
    fileName: string
    category: SchemaFile['category']
    storageMode: 'static-public-file' | 'unavailable'
    error?: string
  }
}

export type SchemaValidationResult = {
  valid: boolean
  schemaSlug: string
  schemaTitle: string
  validator: 'ajv-draft-2020-12'
  errors: Array<{
    path: string
    message: string
    keyword: string
    schemaPath: string
  }>
}

const SCHEMA_DIR = path.join(process.cwd(), 'public', 'schemas', 'json')
const STATIC_DATE = '2026-05-10T00:00:00.000Z'

function readJsonFile(fileName: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    const raw = fs.readFileSync(path.join(SCHEMA_DIR, fileName), 'utf8')
    return { ok: true, data: JSON.parse(raw) }
  } catch (error) {
    return { ok: false, error: (error as Error).message }
  }
}

function schemaRecord(schemaFile: SchemaFile): JsonSchemaRecord {
  const loaded = readJsonFile(schemaFile.fileName)
  const schema = loaded.ok ? loaded.data : null
  const schemaObject = schema && typeof schema === 'object' ? (schema as Record<string, unknown>) : {}

  return {
    id: `json-schema:${schemaFile.slug}`,
    slug: schemaFile.slug,
    title: typeof schemaObject.title === 'string' ? schemaObject.title : schemaFile.title,
    description: typeof schemaObject.description === 'string' ? schemaObject.description : schemaFile.description,
    schema,
    version: typeof schemaObject.version === 'string' ? schemaObject.version : '1.0.0',
    status: loaded.ok ? 'active' : 'unavailable',
    source: 'public-file',
    url: `${BASE_URL}${schemaFile.path}`,
    path: schemaFile.path,
    traceId: null,
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    metadata: {
      fileName: schemaFile.fileName,
      category: schemaFile.category,
      storageMode: loaded.ok ? 'static-public-file' : 'unavailable',
      ...(loaded.ok ? {} : { error: loaded.error }),
    },
  }
}

function sharedDefs(): Record<string, unknown> | null {
  const loaded = readJsonFile('platphorm-universal-schema-pack.json')
  if (!loaded.ok || !loaded.data || typeof loaded.data !== 'object') return null
  const pack = loaded.data as Record<string, unknown>
  const properties = pack.properties
  if (!properties || typeof properties !== 'object') return null
  const defs = (properties as Record<string, unknown>).$defs
  return defs && typeof defs === 'object' ? defs as Record<string, unknown> : null
}

function schemaWithSharedDefs(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema
  const object = schema as Record<string, unknown>
  if (object.$defs) return object
  const defs = sharedDefs()
  return defs ? { ...object, $defs: defs } : object
}

export function listSchemas(): JsonSchemaRecord[] {
  return SCHEMA_FILES.map(schemaRecord)
}

export function getSchema(slug: string): JsonSchemaRecord | null {
  const schemaFile = findSchemaBySlug(slug)
  return schemaFile ? schemaRecord(schemaFile) : null
}

export function getSchemaPack() {
  const schemas = listSchemas()
  return {
    id: 'platphorm-universal-schema-pack',
    title: 'PlatPhorm Universal Schema Pack',
    status: schemas.every((schema) => schema.status === 'active') ? 'active' : 'degraded',
    source: 'public-file',
    storageMode: 'static-public-file',
    schemaCount: schemas.length,
    activeSchemaCount: schemas.filter((schema) => schema.status === 'active').length,
    schemas: schemas.map(({ schema, ...metadata }) => metadata),
    files: schemas.map((schema) => ({
      slug: schema.slug,
      title: schema.title,
      url: schema.url,
      path: schema.path,
      status: schema.status,
    })),
    updatedAt: STATIC_DATE,
  }
}

function createAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true })
  addFormats(ajv)

  for (const record of listSchemas()) {
    const compiledSchema = schemaWithSharedDefs(record.schema)
    if (compiledSchema && typeof compiledSchema === 'object') {
      const schema = compiledSchema as Record<string, unknown>
      if (typeof schema.$id === 'string') {
        try {
          ajv.addSchema(schema, schema.$id)
        } catch {
          // Duplicate or incompatible schema IDs should not block validating the requested schema.
        }
      }
    }
  }

  return ajv
}

export function validateJsonAgainstSchema(json: string, schemaSlug: string): SchemaValidationResult {
  const jsonValidation = validateJsonString(json)
  const record = getSchema(schemaSlug)

  if (!jsonValidation.valid) {
    return {
      valid: false,
      schemaSlug,
      schemaTitle: record?.title || schemaSlug,
      validator: 'ajv-draft-2020-12',
      errors: [
        {
          path: '$',
          message: jsonValidation.error || 'Invalid JSON',
          keyword: 'parse',
          schemaPath: '#',
        },
      ],
    }
  }

  if (!record?.schema || record.status !== 'active') {
    return {
      valid: false,
      schemaSlug,
      schemaTitle: record?.title || schemaSlug,
      validator: 'ajv-draft-2020-12',
      errors: [
        {
          path: '$',
          message: 'Schema is unavailable in the public registry.',
          keyword: 'schema_unavailable',
          schemaPath: '#',
        },
      ],
    }
  }

  const ajv = createAjv()
  const schema = schemaWithSharedDefs(record.schema) as Record<string, unknown>
  const validate = typeof schema.$id === 'string' ? ajv.getSchema(schema.$id) || ajv.compile(schema) : ajv.compile(schema)
  const valid = validate(jsonValidation.parsed) === true

  return {
    valid,
    schemaSlug: record.slug,
    schemaTitle: record.title,
    validator: 'ajv-draft-2020-12',
    errors: (validate.errors || []).map((error) => ({
      path: error.instancePath || '$',
      message: error.message || 'Schema validation failed.',
      keyword: error.keyword,
      schemaPath: error.schemaPath,
    })),
  }
}

export function getJsonLdArtifacts() {
  return {
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'JSON Tree + PlatPhorm Schema Registry',
      url: BASE_URL,
    },
    softwareApplication: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'JSON Tree + PlatPhorm Schema Registry',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: BASE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    dataset: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'PlatPhorm Universal Schema Pack',
      url: `${BASE_URL}/schemas/json/platphorm-universal-schema-pack.json`,
      distribution: SCHEMA_FILES.map((schema) => ({
        '@type': 'DataDownload',
        name: schema.title,
        contentUrl: `${BASE_URL}${schema.path}`,
        encodingFormat: 'application/schema+json',
      })),
    },
  }
}

export function validateJsonLd(json: string) {
  const parsed = validateJsonString(json)
  if (!parsed.valid) {
    return {
      valid: false,
      validator: 'local-jsonld-structural',
      errors: [{ path: '$', message: parsed.error || 'Invalid JSON' }],
    }
  }

  const value = parsed.parsed
  const documents = Array.isArray(value) ? value : [value]
  const errors: Array<{ path: string; message: string }> = []

  documents.forEach((document, index) => {
    if (!document || typeof document !== 'object') {
      errors.push({ path: `$[${index}]`, message: 'JSON-LD document must be an object.' })
      return
    }

    const object = document as Record<string, unknown>
    if (!('@context' in object)) errors.push({ path: `$[${index}].@context`, message: 'Missing @context.' })
    if (!('@type' in object)) errors.push({ path: `$[${index}].@type`, message: 'Missing @type.' })
  })

  return {
    valid: errors.length === 0,
    validator: 'local-jsonld-structural',
    errors,
  }
}

export function getUniverseRegistry() {
  const schemaPack = getSchemaPack()

  return {
    universes: [
      {
        id: 'platphorm-json',
        slug: 'json-tree-schema-registry',
        title: 'JSON Tree + PlatPhorm Schema Registry',
        description: 'Public JSON utility and schema registry layer for the PlatPhormNews web mesh.',
        status: schemaPack.status,
        realms: ['json-schema-registry'],
        metadata: {
          storageMode: 'static-public-file',
          schemaCount: schemaPack.schemaCount,
          publicSafe: true,
        },
      },
    ],
    realms: [
      {
        id: 'json-schema-registry',
        universeId: 'platphorm-json',
        slug: 'json-schema-registry',
        title: 'JSON Schema Registry',
        description: 'Public schema pack, JSON-LD artifacts, and contract schemas served by json.platphormnews.com.',
        schemaRef: '/schemas/json/platphorm-universal-schema-pack.json',
        itemCount: schemaPack.activeSchemaCount,
        metadata: {
          storageMode: 'static-public-file',
          publicSafe: true,
        },
      },
    ],
    items: listSchemas().map((schema) => ({
      id: `schema:${schema.slug}`,
      realmId: 'json-schema-registry',
      slug: schema.slug,
      data: {
        title: schema.title,
        description: schema.description,
        status: schema.status,
        url: schema.url,
      },
      provenance: 'public schema file bundled in this repo',
      traceId: null,
      metadata: schema.metadata,
    })),
  }
}
