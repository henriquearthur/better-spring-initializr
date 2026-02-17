import { LayoutPanelTop } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { CuratedPreset } from '@/lib/curated-presets'
import type { InitializrDependency } from '@/server/lib/initializr-client'

type PresetLayoutSurfaceProps = {
  presets: CuratedPreset[]
  selectedPresetId: string | null
  onSelectPreset: (presetId: string) => void
  availableDependencies: InitializrDependency[]
  metadataAvailable: boolean
  selectedDependencyCount: number
  disabled?: boolean
}

export function PresetLayoutSurface({
  presets,
  selectedPresetId,
  onSelectPreset,
  availableDependencies,
  metadataAvailable,
  selectedDependencyCount,
  disabled = false,
}: PresetLayoutSurfaceProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const activePreset = useMemo(() => {
    if (!selectedPresetId) {
      return null
    }

    return presets.find((preset) => preset.id === selectedPresetId) ?? null
  }, [presets, selectedPresetId])

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

  if (presets.length === 0) {
    return (
      <section className="rounded-xl border bg-[var(--card)] p-3" data-testid="preset-surface-hero-strip">
        <p className="text-sm font-semibold">Curated Presets</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Presets are unavailable right now.
        </p>
      </section>
    )
  }

  return (
    <section
      className="preset-layout-enter relative overflow-hidden rounded-2xl border bg-[var(--card)] p-4"
      data-testid="preset-surface-hero-strip"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-emerald-500/10 to-transparent" />
      <div className="pointer-events-none absolute -top-16 right-4 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900 dark:text-emerald-200">
            <LayoutPanelTop className="h-3.5 w-3.5" />
            Curated Starter Lane
          </p>
          <p className="text-sm font-semibold">Start with a production-ready blueprint</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Click a preset to apply dependencies, and click it again to deselect.
          </p>
        </div>
        <span className="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {selectedDependencyCount} selected
        </span>
      </div>

      <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-3">
        {presets.map((preset) => {
          const isActive = preset.id === activePreset?.id

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              disabled={disabled}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${isActive ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_10px_24px_-22px_rgba(5,150,105,0.95)]' : 'hover:border-emerald-500/40 hover:bg-[var(--muted)]'} disabled:opacity-60`}
            >
              <p className="text-sm font-semibold">{preset.name}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{preset.intent}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {preset.dependencyIds.length} dependencies
              </p>
            </button>
          )
        })}
      </div>

      <div className="relative z-10 mt-4 rounded-xl border bg-[var(--card)] p-3">
        {activePreset ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{activePreset.name}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{activePreset.intent}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activePreset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900 dark:text-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen((current) => !current)}
                className="btn btn-secondary btn-sm h-8 text-[11px]"
              >
                {detailsOpen ? 'Hide details' : 'Inspect details'}
              </button>
            </div>

            {detailsOpen ? (
              <div className="mt-3 border-t pt-3">
                <PresetDependencyList
                  preset={activePreset}
                  dependencyById={dependencyById}
                  metadataAvailable={metadataAvailable}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <p className="text-sm font-semibold">No preset selected</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Choose one of the curated presets above to apply dependencies automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

type PresetDependencyListProps = {
  preset: CuratedPreset
  dependencyById: Map<string, { id: string; name: string }>
  metadataAvailable: boolean
}

function PresetDependencyList({
  preset,
  dependencyById,
  metadataAvailable,
}: PresetDependencyListProps) {
  const missingDependencyIds = metadataAvailable
    ? preset.dependencyIds.filter((dependencyId) => !dependencyById.has(dependencyId))
    : []

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Dependencies
      </p>
      <ul className="mt-2 space-y-1.5">
        {preset.dependencyIds.map((dependencyId) => {
          const dependency = dependencyById.get(dependencyId)

          return (
            <li key={dependencyId} className="text-xs">
              <span>{dependency ? dependency.name : dependencyId}</span>
              <span className="ml-1 text-[var(--muted-foreground)]">({dependencyId})</span>
            </li>
          )
        })}
      </ul>

      {missingDependencyIds.length > 0 ? (
        <p className="mt-2 rounded-md border border-amber-400/80 bg-amber-100 px-2.5 py-2 text-[11px] text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          {missingDependencyIds.length} dependencies are unavailable in current metadata.
        </p>
      ) : null}
    </div>
  )
}
