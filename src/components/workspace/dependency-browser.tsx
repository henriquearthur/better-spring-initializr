import { Search } from 'lucide-react'
import { useMemo } from 'react'

import type { DependencyGroup } from '@/hooks/use-dependency-browser'

type DependencyBrowserProps = {
  dependencyGroups: DependencyGroup[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedDependencyIds: string[]
  onToggleDependency: (dependencyId: string) => void
  hasMetadata: boolean
  disabled?: boolean
}

export function DependencyBrowser({
  dependencyGroups,
  searchTerm,
  onSearchTermChange,
  selectedDependencyIds,
  onToggleDependency,
  hasMetadata,
  disabled = false,
}: DependencyBrowserProps) {
  const selectedIdSet = useMemo(() => new Set(selectedDependencyIds), [selectedDependencyIds])

  const hasAnyDependencies = dependencyGroups.length > 0

  return (
    <div className="space-y-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Search dependencies</span>
        <div className="flex h-9 items-center rounded-md border bg-[var(--background)] px-2.5 text-sm focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <Search className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Name or description"
            disabled={disabled}
            className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed"
          />
        </div>
      </label>

      {!hasMetadata ? (
        <EmptyState
          title="Dependency metadata not ready"
          description="Dependencies will appear here once metadata is available from Spring Initializr."
        />
      ) : null}

      {hasMetadata && !hasAnyDependencies ? (
        <EmptyState
          title="No dependencies match your search"
          description={
            searchTerm.trim()
              ? `No results found for \"${searchTerm.trim()}\". Try a broader keyword.`
              : 'No dependencies are available in the current metadata payload.'
          }
        />
      ) : null}

      {hasMetadata && hasAnyDependencies ? (
        <div className="space-y-3">
          {dependencyGroups.map((group) => (
            <section key={group.category} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {group.category}
              </p>

              <div className="grid gap-2">
                {group.dependencies.map((dependency) => {
                  const isSelected = selectedIdSet.has(dependency.id)

                  return (
                    <button
                      key={dependency.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleDependency(dependency.id)}
                      className={`rounded-lg border px-3 py-2 text-left transition ${isSelected ? 'border-emerald-400 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100' : 'bg-[var(--card)] hover:border-emerald-500/40'} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{dependency.name}</p>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                          {group.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {dependency.description ?? 'No description available for this dependency.'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-[var(--card)] px-3 py-4 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
    </div>
  )
}
