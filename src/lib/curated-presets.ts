import { normalizeProjectConfig, type ProjectConfig } from './project-config'

export type CuratedPreset = {
  id: string
  name: string
  intent: string
  tags: string[]
  configOverrides: Partial<ProjectConfig>
  dependencyIds: string[]
}

export type WorkspaceSnapshot = {
  config: ProjectConfig
  selectedDependencyIds: string[]
}

export type ApplyCuratedPresetResult =
  | {
      ok: true
      preset: CuratedPreset
      next: WorkspaceSnapshot
    }
  | {
      ok: false
      code: 'PRESET_NOT_FOUND'
      next: WorkspaceSnapshot
    }

export const CURATED_PRESETS: CuratedPreset[] = [
  {
    id: 'rest-api-postgres',
    name: 'REST API + PostgreSQL',
    intent: 'Bootstrap a production-ready REST API with persistence and validation.',
    tags: ['REST', 'PostgreSQL', 'Validation'],
    configOverrides: {
      artifact: 'api-service',
      name: 'api-service',
      description: 'REST API service backed by PostgreSQL',
      packageName: 'com.example.apiservice',
      buildTool: 'maven-project',
      language: 'java',
      packaging: 'jar',
    },
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
    configOverrides: {
      artifact: 'reactive-service',
      name: 'reactive-service',
      description: 'Reactive microservice with non-blocking IO',
      packageName: 'com.example.reactiveservice',
      buildTool: 'gradle-project',
      language: 'kotlin',
      packaging: 'jar',
    },
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
    configOverrides: {
      artifact: 'batch-worker',
      name: 'batch-worker',
      description: 'Batch worker for scheduled processing pipelines',
      packageName: 'com.example.batchworker',
      buildTool: 'maven-project',
      language: 'java',
      packaging: 'jar',
    },
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
  snapshot: WorkspaceSnapshot,
  presetId: string,
): ApplyCuratedPresetResult {
  const preset = getCuratedPresetById(presetId)

  if (!preset) {
    return {
      ok: false,
      code: 'PRESET_NOT_FOUND',
      next: {
        config: normalizeProjectConfig(snapshot.config),
        selectedDependencyIds: normalizeDependencyIds(snapshot.selectedDependencyIds),
      },
    }
  }

  return {
    ok: true,
    preset,
    next: {
      config: normalizeProjectConfig({
        ...snapshot.config,
        ...preset.configOverrides,
      }),
      selectedDependencyIds: normalizeDependencyIds([
        ...snapshot.selectedDependencyIds,
        ...preset.dependencyIds,
      ]),
    },
  }
}

function normalizeDependencyIds(dependencyIds: string[]): string[] {
  return Array.from(new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)))
}
