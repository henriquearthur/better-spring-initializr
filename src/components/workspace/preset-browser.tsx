import { useMemo } from 'react'

import type { CuratedPreset } from '@/lib/curated-presets'
import type { InitializrDependency } from '@/server/lib/initializr-client'

type PresetBrowserProps = {
  presets: CuratedPreset[]
  selectedPresetId: string | null
  onSelectPreset: (presetId: string) => void
  onApplyPreset: (presetId: string) => void
  availableDependencies: InitializrDependency[]
  disabled?: boolean
}

const CONFIG_LABELS: Partial<Record<keyof CuratedPreset['configOverrides'], string>> = {
  artifact: 'Artifact',
  buildTool: 'Build tool',
  description: 'Description',
  language: 'Language',
  name: 'Name',
  packageName: 'Package name',
  packaging: 'Packaging',
}

export function PresetBrowser({
  presets,
  selectedPresetId,
  onSelectPreset,
  onApplyPreset,
  availableDependencies,
  disabled = false,
}: PresetBrowserProps) {
  const dependencyById = useMemo(
    () =>
      new Map(
        availableDependencies.map((dependency) => [
          dependency.id,
          {
            id: dependency.id,
            name: dependency.name,
          },
        ]),
      ),
    [availableDependencies],
  )

  return (
    <div className="space-y-3">
      {presets.map((preset) => {
        const isExpanded = preset.id === selectedPresetId
        const presetConfigEntries = Object.entries(preset.configOverrides)
        const missingDependencyIds = preset.dependencyIds.filter(
          (dependencyId) => !dependencyById.has(dependencyId),
        )

        return (
          <article key={preset.id} className="rounded-lg border bg-[var(--card)] p-3">
            <button
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              disabled={disabled}
              className={`w-full rounded-md border px-3 py-2 text-left transition ${isExpanded ? 'border-emerald-400 bg-emerald-500/10' : 'border-transparent hover:border-emerald-500/40'} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{preset.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{preset.intent}</p>
                </div>

                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {preset.dependencyIds.length} deps
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {preset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>

            {isExpanded ? (
              <div className="mt-3 space-y-3 rounded-md border bg-[var(--background)] p-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Includes: Config overrides
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {presetConfigEntries.map(([field, value]) => (
                      <li key={field} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--muted-foreground)]">
                          {CONFIG_LABELS[field as keyof CuratedPreset['configOverrides']] ?? field}
                        </span>
                        <span className="font-mono text-[11px]">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Includes: Dependencies
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {preset.dependencyIds.map((dependencyId) => {
                      const metadataDependency = dependencyById.get(dependencyId)

                      return (
                        <li key={dependencyId} className="flex items-center justify-between gap-3 text-xs">
                          <span>
                            {metadataDependency ? metadataDependency.name : dependencyId}
                            <span className="ml-1 text-[var(--muted-foreground)]">({dependencyId})</span>
                          </span>
                          {!metadataDependency ? (
                            <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                              Not in metadata
                            </span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>

                  {missingDependencyIds.length > 0 ? (
                    <p className="mt-2 rounded-md border border-amber-300/70 bg-amber-50/70 px-2.5 py-2 text-[11px] text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                      Compatibility note: {missingDependencyIds.length} preset dependency
                      {missingDependencyIds.length > 1 ? 'ies are' : ' is'} unavailable in current
                      Spring Initializr metadata and may not be selectable.
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onApplyPreset(preset.id)}
                  disabled={disabled}
                  className="h-8 rounded-md border border-emerald-500/50 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
                >
                  Apply preset
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
