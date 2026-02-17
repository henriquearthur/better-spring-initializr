# Curated Presets

Each preset is a JSON file in this folder.

## Add or update a preset

1. Create or edit `*.json` in this folder.
2. Keep `id` stable and kebab-case (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
3. Set `sortOrder` to control UI ordering (lower first).
4. Include at least one `tag` and one `dependencyId`.
5. Use `optionalDependencyResolvers` only when a dependency must be selected dynamically from Initializr metadata.

## Optional dependency resolvers

Supported strategy:

- `first-available`: picks the first dependency id found in metadata from `candidates`.
- `fallbackNamePattern` (optional): case-insensitive regex matched against dependency names when no candidate id exists.

Example:

```json
{
  "optionalDependencyResolvers": [
    {
      "strategy": "first-available",
      "candidates": ["springdoc-openapi-starter-webmvc-ui", "swagger"],
      "fallbackNamePattern": "openapi|swagger"
    }
  ]
}
```

## Validation

- Presets are validated at runtime during module load (fail-fast in tests/build).
- JSON contract: `preset.schema.json`.

