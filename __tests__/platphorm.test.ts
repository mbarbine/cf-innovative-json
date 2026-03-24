import { expect, test, describe } from 'vitest'
import fs from 'fs'
import Ajv from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ strict: false })
addFormats(ajv)

describe('PlatPhorm Universal Schema Pack', () => {
  const masterPackStr = fs.readFileSync('public/schemas/json/platphorm-universal-schema-pack.json', 'utf8')
  const masterPack = JSON.parse(masterPackStr)

  test('Master schema should be valid JSON', () => {
    expect(masterPack).toBeDefined()
    expect(masterPack.$id).toBe('https://platphormnews.com/schemas/platphorm-universal-schema-pack.json')
  })

  test('Validates a correct Universe object', () => {
    // Extract the schema components
    const universeSchema = masterPack.properties.$defs.universe
    // To resolve internal $refs (like $ref: "#/$defs/idInteger"), we need to compile a schema that includes those defs
    const schemaToCompile = {
      $id: "universeTest",
      ...universeSchema,
      $defs: masterPack.properties.$defs
    }

    const validate = ajv.compile(schemaToCompile)

    const validUniverse = {
      id: 1,
      slug: 'platphorm-schema-registry',
      name: 'Schema Registry',
      environment: 'production',
      visibility: 'public',
      trust_level: 'standard',
      feature_tags: ['api', 'docs'],
      environment_tags: ['production'],
      governance_tags: ['open-source']
    }

    const isValid = validate(validUniverse)
    if (!isValid) console.error(validate.errors)
    expect(isValid).toBe(true)
  })

  test('Rejects invalid Universe missing required fields', () => {
    const universeSchema = masterPack.properties.$defs.universe
    const schemaToCompile = {
      $id: "universeTest2",
      ...universeSchema,
      $defs: masterPack.properties.$defs
    }

    const validate = ajv.compile(schemaToCompile)

    const invalidUniverse = {
      id: 1,
      // Missing slug, name, etc.
    }

    const isValid = validate(invalidUniverse)
    expect(isValid).toBe(false)
  })

  test('Validates a correct Realm object', () => {
    const realmSchema = masterPack.properties.$defs.realm
    const schemaToCompile = {
      $id: "realmTest",
      ...realmSchema,
      $defs: masterPack.properties.$defs
    }

    const validate = ajv.compile(schemaToCompile)

    const validRealm = {
      id: 100,
      universe_id: 1,
      slug: 'platphorm-schema-registry',
      name: 'PlatPhorm Docs',
      realm_type: 'documentation-platform',
      primary_domain: 'docs.platphormnews.com',
      canonical_url: 'https://docs.platphormnews.com',
      environment: 'production',
      visibility: 'public',
      feature_tags: ['docs'],
      environment_tags: ['production'],
      governance_tags: ['open-source']
    }

    const isValid = validate(validRealm)
    if (!isValid) console.error(validate.errors)
    expect(isValid).toBe(true)
  })
})
