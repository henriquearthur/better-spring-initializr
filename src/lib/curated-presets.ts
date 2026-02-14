export type CuratedPreset = {
  id: string
  name: string
  intent: string
  tags: string[]
  dependencyIds: string[]
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

export const CURATED_PRESETS: CuratedPreset[] = [
  {
    id: 'rest-api-postgres',
    name: 'REST API + PostgreSQL',
    intent: 'Bootstrap a production-ready REST API with persistence and validation.',
    tags: ['REST', 'PostgreSQL', 'Validation'],
    dependencyIds: [
      'web',
      'validation',
      'data-jpa',
      'postgresql',
      'flyway',
      'actuator',
    ],
  },
  {
    id: 'reactive-microservice',
    name: 'Reactive Microservice',
    intent: 'Start a non-blocking microservice with observability and reactive data access.',
    tags: ['Reactive', 'WebFlux', 'Microservice'],
    dependencyIds: [
      'webflux',
      'validation',
      'actuator',
      'r2dbc',
      'postgresql',
      'cloud-starter',
    ],
  },
  {
    id: 'batch-worker',
    name: 'Batch Worker',
    intent: 'Generate a scheduled worker for data ingestion and resilient retries.',
    tags: ['Batch', 'Scheduling', 'Worker'],
    dependencyIds: ['batch', 'integration', 'validation', 'actuator', 'postgresql'],
  },
]

export function getCuratedPresetById(presetId: string): CuratedPreset | null {
  const normalizedId = presetId.trim()

  if (!normalizedId) {
    return null
  }

  return CURATED_PRESETS.find((preset) => preset.id === normalizedId) ?? null
}

export function applyCuratedPreset(
  selectedDependencyIds: string[],
  presetId: string,
): ApplyCuratedPresetResult {
  const preset = getCuratedPresetById(presetId)

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

function normalizeDependencyIds(dependencyIds: string[]): string[] {
  return Array.from(new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)))
}
