export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentConfigurationError'
  }
}

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]

  if (!value || !value.trim()) {
    throw new EnvironmentConfigurationError(`${name} must be configured.`)
  }

  return value.trim()
}

export function requireEnvironmentVariableMinLength(
  name: string,
  minimumLength: number,
): string {
  const value = requireEnvironmentVariable(name)

  if (value.length < minimumLength) {
    throw new EnvironmentConfigurationError(
      `${name} must be configured with at least ${minimumLength} characters.`,
    )
  }

  return value
}
