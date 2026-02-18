export type AiSkillCatalogId = `skill-${string}`

export type AiSkillCatalogSource = {
  id: AiSkillCatalogId
  label: string
  description: string
  directoryName: string
  sortOrder: number
}

const SKILL_ID_PATTERN = /^skill-[a-z0-9]+(?:-[a-z0-9]+)*$/
const SKILL_DIRECTORY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const SKILL_MODULES = import.meta.glob('../skills/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const AI_SKILL_CATALOG_SOURCES = loadAiSkillSourcesFromModules(SKILL_MODULES)

export function loadAiSkillSourcesFromModules(
  skillModules: Record<string, unknown>,
): AiSkillCatalogSource[] {
  const moduleEntries = Object.entries(skillModules).filter(
    ([filePath]) => !filePath.endsWith('/skill.schema.json'),
  )

  if (moduleEntries.length === 0) {
    throw new Error('AI skill catalog is empty. Add JSON files under src/skills/.')
  }

  const normalizedSources = moduleEntries
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, value]) => normalizeAiSkillSource(path, value))

  const seenSkillIds = new Set<AiSkillCatalogId>()
  const seenDirectoryNames = new Set<string>()

  for (const skillSource of normalizedSources) {
    if (seenSkillIds.has(skillSource.id)) {
      throw new Error(`Duplicate AI skill id "${skillSource.id}".`)
    }

    if (seenDirectoryNames.has(skillSource.directoryName)) {
      throw new Error(
        `Duplicate AI skill directoryName "${skillSource.directoryName}".`,
      )
    }

    seenSkillIds.add(skillSource.id)
    seenDirectoryNames.add(skillSource.directoryName)
  }

  return normalizedSources.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return left.id.localeCompare(right.id)
  })
}

function normalizeAiSkillSource(
  filePath: string,
  value: unknown,
): AiSkillCatalogSource {
  const source = asObject(value, filePath)
  assertAllowedKeys(
    source,
    ['$schema', 'id', 'label', 'description', 'directoryName', 'sortOrder'],
    filePath,
  )

  const id = normalizeSkillId(source.id, `${filePath}: id`)
  const label = normalizeNonEmptyString(source.label, `${filePath}: label`)
  const description = normalizeNonEmptyString(
    source.description,
    `${filePath}: description`,
  )
  const directoryName = normalizeSkillDirectoryName(
    source.directoryName,
    `${filePath}: directoryName`,
  )
  const sortOrder = normalizeNonNegativeInteger(source.sortOrder, `${filePath}: sortOrder`)

  return {
    id,
    label,
    description,
    directoryName,
    sortOrder,
  }
}

function normalizeSkillId(value: unknown, context: string): AiSkillCatalogId {
  const normalized = normalizeNonEmptyString(value, context)

  if (!SKILL_ID_PATTERN.test(normalized)) {
    throw new Error(
      `${context} must match ${SKILL_ID_PATTERN.source}.`,
    )
  }

  return normalized as AiSkillCatalogId
}

function normalizeSkillDirectoryName(value: unknown, context: string): string {
  const normalized = normalizeNonEmptyString(value, context)

  if (!SKILL_DIRECTORY_PATTERN.test(normalized)) {
    throw new Error(
      `${context} must match ${SKILL_DIRECTORY_PATTERN.source}.`,
    )
  }

  return normalized
}

function normalizeNonEmptyString(value: unknown, context: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${context} must be a string.`)
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${context} must be a non-empty string.`)
  }

  return normalized
}

function normalizeNonNegativeInteger(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${context} must be a non-negative integer.`)
  }

  return value
}

function asObject(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`)
  }

  return value as Record<string, unknown>
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
  context: string,
) {
  const allowedKeySet = new Set(allowedKeys)

  for (const key of Object.keys(value)) {
    if (!allowedKeySet.has(key)) {
      throw new Error(`${context} contains unsupported key "${key}".`)
    }
  }
}
