import { z, type ZodType } from 'zod'

export { z }

export class ServerPayloadValidationError extends Error {
  constructor(
    message: string,
    readonly issues: z.ZodIssue[],
  ) {
    super(message)
    this.name = 'ServerPayloadValidationError'
  }
}

export const projectConfigSchema = z.object({
  group: z.string(),
  artifact: z.string(),
  name: z.string(),
  description: z.string(),
  packageName: z.string(),
  javaVersion: z.string(),
  springBootVersion: z.string(),
  buildTool: z.enum(['maven-project', 'gradle-project']),
  language: z.enum(['java', 'kotlin']),
  packaging: z.enum(['jar', 'war']),
})

export function parsePayload<TValue>(
  schema: ZodType<TValue>,
  input: unknown,
  message: string,
): TValue {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new ServerPayloadValidationError(message, result.error.issues)
  }

  return result.data
}

export function normalizeStringArray(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
}
