import type { InitializrDependency } from '@/server/lib/initializr-client'

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
      'devtools',
    ],
  },
  {
    id: 'rest-api-mysql',
    name: 'REST API + MySQL',
    intent: 'Ship a production-ready REST API backed by MySQL with schema migrations.',
    tags: ['REST', 'MySQL', 'Validation'],
    dependencyIds: [
      'web',
      'validation',
      'data-jpa',
      'mysql',
      'flyway',
      'actuator',
      'devtools',
    ],
  },
  {
    id: 'secure-rest-api',
    name: 'Secure REST API',
    intent: 'Start a JWT-protected REST API with Spring Security and resource server support.',
    tags: ['REST', 'Security', 'JWT'],
    dependencyIds: [
      'web',
      'validation',
      'security',
      'oauth2-resource-server',
      'actuator',
      'devtools',
    ],
  },
  {
    id: 'event-driven-kafka',
    name: 'Event-Driven Kafka',
    intent: 'Start an event-driven service with Spring Cloud Stream and Kafka bindings.',
    tags: ['Event-Driven', 'Kafka', 'Cloud Stream'],
    dependencyIds: ['cloud-stream', 'kafka', 'actuator', 'devtools'],
  },
  {
    id: 'event-driven-rabbitmq',
    name: 'Event-Driven RabbitMQ',
    intent: 'Build asynchronous messaging flows with Spring Cloud Stream and RabbitMQ.',
    tags: ['Event-Driven', 'RabbitMQ', 'Cloud Stream'],
    dependencyIds: ['cloud-stream', 'amqp', 'actuator', 'devtools'],
  },
  {
    id: 'api-gateway-reactive',
    name: 'API Gateway Reactive',
    intent: 'Bootstrap a reactive edge gateway for routing, filters, and observability.',
    tags: ['Gateway', 'Reactive', 'Cloud'],
    dependencyIds: ['cloud-gateway-reactive', 'actuator', 'devtools'],
  },
]

const SWAGGER_DEPENDENCY_ID_CANDIDATES = [
  'springdoc-openapi-starter-webmvc-ui',
  'springdoc-openapi',
  'openapi',
  'swagger',
]

export function resolveCuratedPresets(
  availableDependencies: InitializrDependency[],
): CuratedPreset[] {
  const swaggerDependencyId = resolveSwaggerDependencyId(availableDependencies)

  if (!swaggerDependencyId) {
    return CURATED_PRESETS
  }

  return CURATED_PRESETS.map((preset) => {
    if (preset.id !== 'rest-api-postgres') {
      return preset
    }

    return {
      ...preset,
      dependencyIds: normalizeDependencyIds([...preset.dependencyIds, swaggerDependencyId]),
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

function normalizeDependencyIds(dependencyIds: string[]): string[] {
  return Array.from(new Set(dependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)))
}

function resolveSwaggerDependencyId(
  availableDependencies: InitializrDependency[],
): string | null {
  const dependencyById = new Map(
    availableDependencies.map((dependency) => [dependency.id.trim(), dependency]),
  )

  for (const candidateId of SWAGGER_DEPENDENCY_ID_CANDIDATES) {
    if (dependencyById.has(candidateId)) {
      return candidateId
    }
  }

  const dependencyWithSwagger = availableDependencies.find((dependency) =>
    /openapi|swagger/i.test(dependency.name),
  )

  return dependencyWithSwagger?.id ?? null
}
