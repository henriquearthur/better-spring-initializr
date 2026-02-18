import type { InitializrDependency } from '@/shared/lib/project-config/initializr-metadata'

export type CuratedPreset = {
  id: string
  name: string
  intent: string
  tags: string[]
  dependencyIds: string[]
}

type CuratedPresetOptionalDependencyResolver = {
  strategy: 'first-available'
  candidates: string[]
  fallbackNamePattern?: string
}

export type CuratedPresetSource = CuratedPreset & {
  sortOrder: number
  optionalDependencyResolvers?: CuratedPresetOptionalDependencyResolver[]
}

export type ApplyCuratedPresetResult =
  | {
      ok: true
      preset: CuratedPreset
      nextSelectedDependencyIds: string[]
    }
  | {
      ok: false
      code: 'PRESET_NOT_FOUND'
      nextSelectedDependencyIds: string[]
    }

const PRESET_MODULES = import.meta.glob('../../../presets/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const CURATED_PRESET_SOURCES = loadCuratedPresetSourcesFromModules(PRESET_MODULES)

export const CURATED_PRESETS: CuratedPreset[] = CURATED_PRESET_SOURCES.map((presetSource) =>
  toCuratedPreset(presetSource),
)

export function resolveCuratedPresets(
  availableDependencies: InitializrDependency[],
): CuratedPreset[] {
  const normalizedDependencies = availableDependencies.map((dependency) => ({
    ...dependency,
    id: dependency.id.trim(),
  }))
  const dependencyById = new Map(
    normalizedDependencies.map((dependency) => [dependency.id, dependency]),
  )

  return CURATED_PRESET_SOURCES.map((presetSource) => {
    const optionalDependencyIds = resolveOptionalDependencyIds(
      presetSource.optionalDependencyResolvers,
      normalizedDependencies,
      dependencyById,
    )

    return {
      ...toCuratedPreset(presetSource),
      dependencyIds: normalizeDependencyIds([
        ...presetSource.dependencyIds,
        ...optionalDependencyIds,
      ]),
    }
  })
}

export function getCuratedPresetById(
  presetId: string,
  presets: CuratedPreset[] = CURATED_PRESETS,
): CuratedPreset | null {
  const normalizedId = presetId.trim()

  if (!normalizedId) {
    return null
  }

  return presets.find((preset) => preset.id === normalizedId) ?? null
}

export function applyCuratedPreset(
  selectedDependencyIds: string[],
  presetId: string,
  presets: CuratedPreset[] = CURATED_PRESETS,
): ApplyCuratedPresetResult {
  const preset = getCuratedPresetById(presetId, presets)

  if (!preset) {
    return {
      ok: false,
      code: 'PRESET_NOT_FOUND',
      nextSelectedDependencyIds: normalizeDependencyIds(selectedDependencyIds),
    }
  }

  return {
    ok: true,
    preset,
    nextSelectedDependencyIds: normalizeDependencyIds([
      ...selectedDependencyIds,
      ...preset.dependencyIds,
    ]),
  }
}

export function loadCuratedPresetSourcesFromModules(
  presetModules: Record<string, unknown>,
): CuratedPresetSource[] {
  const moduleEntries = Object.entries(presetModules).filter(
    ([filePath]) => !filePath.endsWith('/preset.schema.json'),
  )

  if (moduleEntries.length === 0) {
    throw new Error('Curated preset catalog is empty. Add JSON files under src/presets/.')
  }

  const normalizedSources = moduleEntries
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, value]) => normalizeCuratedPresetSource(path, value))

  const seenPresetIds = new Set<string>()

  for (const presetSource of normalizedSources) {
    if (seenPresetIds.has(presetSource.id)) {
      throw new Error(`Duplicate curated preset id "${presetSource.id}".`)
    }

    seenPresetIds.add(presetSource.id)
  }

  return normalizedSources.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return left.id.localeCompare(right.id)
  })
}

function toCuratedPreset(presetSource: CuratedPresetSource): CuratedPreset {
  return {
    id: presetSource.id,
    name: presetSource.name,
    intent: presetSource.intent,
    tags: [...presetSource.tags],
    dependencyIds: [...presetSource.dependencyIds],
  }
}

function normalizeCuratedPresetSource(
  filePath: string,
  value: unknown,
): CuratedPresetSource {
  const source = asObject(value, filePath)
  assertAllowedKeys(
    source,
    [
      '$schema',
      'id',
      'name',
      'intent',
      'tags',
      'dependencyIds',
      'sortOrder',
      'optionalDependencyResolvers',
    ],
    filePath,
  )

  const id = normalizeNonEmptyString(source.id, `${filePath}: id`)
  const name = normalizeNonEmptyString(source.name, `${filePath}: name`)
  const intent = normalizeNonEmptyString(source.intent, `${filePath}: intent`)
  const tags = normalizeNonEmptyStringArray(source.tags, `${filePath}: tags`)
  const dependencyIds = normalizeNonEmptyStringArray(
    source.dependencyIds,
    `${filePath}: dependencyIds`,
  )
  const sortOrder = normalizeNonNegativeInteger(source.sortOrder, `${filePath}: sortOrder`)
  const optionalDependencyResolvers = normalizeOptionalDependencyResolvers(
    source.optionalDependencyResolvers,
    `${filePath}: optionalDependencyResolvers`,
  )

  return {
    id,
    name,
    intent,
    tags,
    dependencyIds,
    sortOrder,
    optionalDependencyResolvers,
  }
}

function normalizeOptionalDependencyResolvers(
  value: unknown,
  context: string,
): CuratedPresetOptionalDependencyResolver[] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context} must be a non-empty array when provided.`)
  }

  return value.map((entry, index) =>
    normalizeOptionalDependencyResolver(entry, `${context}[${index}]`),
  )
}

function normalizeOptionalDependencyResolver(
  value: unknown,
  context: string,
): CuratedPresetOptionalDependencyResolver {
  const resolver = asObject(value, context)
  assertAllowedKeys(resolver, ['strategy', 'candidates', 'fallbackNamePattern'], context)

  if (resolver.strategy !== 'first-available') {
    throw new Error(`${context}: strategy must be "first-available".`)
  }

  const candidates = normalizeNonEmptyStringArray(resolver.candidates, `${context}: candidates`)
  const fallbackNamePattern =
    resolver.fallbackNamePattern === undefined
      ? undefined
      : normalizeNonEmptyString(resolver.fallbackNamePattern, `${context}: fallbackNamePattern`)

  if (fallbackNamePattern) {
    try {
      new RegExp(fallbackNamePattern, 'i')
    } catch {
      throw new Error(`${context}: fallbackNamePattern must be a valid regular expression.`)
    }
  }

  return {
    strategy: 'first-available',
    candidates,
    fallbackNamePattern,
  }
}

function resolveOptionalDependencyIds(
  optionalDependencyResolvers: CuratedPresetOptionalDependencyResolver[] | undefined,
  availableDependencies: InitializrDependency[],
  dependencyById: Map<string, InitializrDependency>,
): string[] {
  if (!optionalDependencyResolvers || optionalDependencyResolvers.length === 0) {
    return []
  }

  const resolvedDependencyIds: string[] = []

  for (const resolver of optionalDependencyResolvers) {
    if (resolver.strategy !== 'first-available') {
      continue
    }

    const candidateId = resolver.candidates.find((candidate) =>
      dependencyById.has(candidate),
    )

    if (candidateId) {
      resolvedDependencyIds.push(candidateId)
      continue
    }

    if (!resolver.fallbackNamePattern) {
      continue
    }

    const fallbackPattern = new RegExp(resolver.fallbackNamePattern, 'i')
    const fallbackByName = availableDependencies.find((dependency) =>
      fallbackPattern.test(dependency.name),
    )

    if (fallbackByName) {
      resolvedDependencyIds.push(fallbackByName.id.trim())
    }
  }

  return normalizeDependencyIds(resolvedDependencyIds)
}

function normalizeDependencyIds(dependencyIds: string[]): string[] {
  return Array.from(
    new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)),
  )
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

function normalizeNonEmptyStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`)
  }

  const normalized = normalizeDependencyIds(
    value.map((entry) => {
      if (typeof entry !== 'string') {
        throw new Error(`${context} must contain only strings.`)
      }

      return entry
    }),
  )

  if (normalized.length === 0) {
    throw new Error(`${context} must contain at least one non-empty value.`)
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
