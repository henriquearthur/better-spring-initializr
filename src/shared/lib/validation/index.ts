export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

export function normalizeNonEmptyString(value: unknown, context: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${context} must be a string.`)
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${context} must be a non-empty string.`)
  }

  return normalized
}

export function normalizeNonNegativeInteger(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${context} must be a non-negative integer.`)
  }

  return value
}

export function asObject(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`)
  }

  return value as Record<string, unknown>
}

export function assertAllowedKeys(
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
