export type InitializrOption = {
  id: string
  name: string
  description?: string
  default: boolean
}

export type InitializrDependency = InitializrOption & {
  group: string
}

export type InitializrMetadata = {
  dependencies: InitializrDependency[]
  javaVersions: InitializrOption[]
  springBootVersions: InitializrOption[]
}

export type InitializrMetadataResponseLike =
  | {
      ok: true
      metadata: InitializrMetadata
    }
  | {
      ok: false
    }
