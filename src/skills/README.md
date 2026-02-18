# AI Skills Catalog

Each skill is defined as a JSON file in this folder.

## Add or update a skill

1. Create or edit a `*.json` file in this folder.
2. Keep `id` stable and prefixed with `skill-` (`^skill-[a-z0-9]+(?:-[a-z0-9]+)*$`).
3. Keep `directoryName` stable and kebab-case (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
4. Set `sortOrder` to control UI ordering (lower first).
5. Ensure there is a matching markdown source at `src/server/lib/ai-extra-sources/claude-code-java/<directoryName>/SKILL.md`.

## Validation

- Skills are validated at runtime during module load (fail-fast in tests/build).
- JSON contract: `skill.schema.json`.
- The loader fails when:
  - the catalog is empty
  - IDs are duplicated
  - `directoryName` values are duplicated
  - required fields are missing or unsupported keys are present
- Markdown integrity is checked server-side: each catalog entry must have a matching `SKILL.md`.

## Minimal checklist

- `src/skills/<skill-name>.json`
- `src/server/lib/ai-extra-sources/claude-code-java/<directoryName>/SKILL.md`
