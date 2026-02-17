import {
  normalizeAgentsMdPreferences,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  type AgentsMdPreferences,
  type AiExtraId,
  type AiExtrasTarget,
} from './ai-extras'
import { normalizeProjectConfig, type ProjectConfig } from './project-config'

export type ShareConfigSnapshot = {
  config: ProjectConfig
  selectedDependencyIds: string[]
  selectedAiExtraIds: AiExtraId[]
  agentsMdPreferences: AgentsMdPreferences
  aiExtrasTarget: AiExtrasTarget
}

type ShareConfigV1Payload = {
  v: 1
  config: ProjectConfig
  selectedDependencyIds: string[]
  selectedAiExtraIds?: string[]
  agentsMdPreferences?: Partial<AgentsMdPreferences>
  aiExtrasTarget?: AiExtrasTarget
}

const CURRENT_SHARE_CONFIG_VERSION = 1

export function encodeShareConfig(snapshot: ShareConfigSnapshot): string {
  const payload = {
    v: CURRENT_SHARE_CONFIG_VERSION,
    config: normalizeProjectConfig(snapshot.config),
    selectedDependencyIds: normalizeSelectedDependencyIds(snapshot.selectedDependencyIds),
    selectedAiExtraIds: normalizeSelectedAiExtraIds(snapshot.selectedAiExtraIds),
    agentsMdPreferences: normalizeAgentsMdPreferences(snapshot.agentsMdPreferences),
    aiExtrasTarget: normalizeAiExtrasTarget(snapshot.aiExtrasTarget),
  } satisfies ShareConfigV1Payload

  const encodedJson = new TextEncoder().encode(JSON.stringify(payload))

  return toBase64Url(encodedJson)
}

export function decodeShareConfig(token: string): ShareConfigSnapshot | null {
  if (!token.trim()) {
    return null
  }

  const bytes = fromBase64Url(token)

  if (!bytes) {
    return null
  }

  let parsedPayload: unknown

  try {
    const json = new TextDecoder().decode(bytes)
    parsedPayload = JSON.parse(json)
  } catch {
    return null
  }

  if (!isObject(parsedPayload)) {
    return null
  }

  if (parsedPayload.v !== CURRENT_SHARE_CONFIG_VERSION) {
    return null
  }

  const config = normalizeProjectConfig(parsedPayload.config as Partial<ProjectConfig> | undefined)
  const selectedDependencyIds = normalizeSelectedDependencyIds(
    isStringArray(parsedPayload.selectedDependencyIds)
      ? parsedPayload.selectedDependencyIds
      : [],
  )
  const selectedAiExtraIds = normalizeSelectedAiExtraIds(
    isStringArray(parsedPayload.selectedAiExtraIds) ? parsedPayload.selectedAiExtraIds : [],
  )
  const agentsMdPreferences = normalizeAgentsMdPreferences(
    isObject(parsedPayload.agentsMdPreferences)
      ? (parsedPayload.agentsMdPreferences as Partial<AgentsMdPreferences>)
      : undefined,
  )
  const aiExtrasTarget = normalizeAiExtrasTarget(parsedPayload.aiExtrasTarget)

  return {
    config,
    selectedDependencyIds,
    selectedAiExtraIds,
    agentsMdPreferences,
    aiExtrasTarget,
  }
}

function normalizeSelectedDependencyIds(selectedDependencyIds: string[]): string[] {
  return Array.from(
    new Set(selectedDependencyIds.map((dependencyId) => dependencyId.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null
  }

  const paddingLength = (4 - (value.length % 4)) % 4
  const padded = `${value}${'='.repeat(paddingLength)}`
  const base64 = padded.replaceAll('-', '+').replaceAll('_', '/')

  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  } catch {
    return null
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every((entry) => typeof entry === 'string')
}
