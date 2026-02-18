import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { DependencyGroup } from '@/features/dependencies/model/dependency-browser'

type DependencyBrowserProps = {
  dependencyGroups: DependencyGroup[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedDependencyIds: string[]
  onToggleDependency: (dependencyId: string) => void
  disabled?: boolean
}

export function DependencyBrowser({
  dependencyGroups,
  searchTerm,
  onSearchTermChange,
  selectedDependencyIds,
  onToggleDependency,
  disabled = false,
}: DependencyBrowserProps) {
  const selectedIdSet = useMemo(() => new Set(selectedDependencyIds), [selectedDependencyIds])
  const normalizedSearch = searchTerm.trim()
  const hasAnyDependencies = dependencyGroups.length > 0
  const dependencyById = new Map(
    dependencyGroups.flatMap((group) =>
      group.dependencies.map((dependency) => [dependency.id, dependency] as const),
    ),
  )
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (dependencyGroups.length === 0) {
      setExpandedCategories(new Set())
      return
    }

    const availableCategories = new Set(dependencyGroups.map((group) => group.category))

    setExpandedCategories((current) => {
      const next = new Set(
        Array.from(current).filter((category) => availableCategories.has(category)),
      )

      if (normalizedSearch) {
        for (const group of dependencyGroups) {
          next.add(group.category)
        }

        return next
      }

      for (const group of dependencyGroups) {
        const hasSelectedDependency = group.dependencies.some((dependency) =>
          selectedIdSet.has(dependency.id),
        )

        if (hasSelectedDependency) {
          next.add(group.category)
        }
      }

      return next
    })
  }, [dependencyGroups, normalizedSearch, selectedIdSet])

  const selectedDependencyItems = selectedDependencyIds.map((dependencyId) => {
    const dependency = dependencyById.get(dependencyId)

    return {
      id: dependencyId,
      name: dependency?.name ?? dependencyId,
    }
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current)

      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }

      return next
    })
  }

  return (
    <div className="space-y-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Search dependencies</span>
        <div className="flex h-9 items-center rounded-md border bg-[var(--background)] px-2.5 text-sm focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
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

      {selectedDependencyItems.length > 0 ? (
        <div className="rounded-lg border bg-[var(--background)] p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Selected dependencies
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedDependencyItems.map((dependency) => (
              <button
                key={dependency.id}
                type="button"
                onClick={() => onToggleDependency(dependency.id)}
                disabled={disabled}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--accent)]/45 bg-[var(--interactive-hover)] px-2.5 text-[11px] font-medium"
                title={`Remove ${dependency.name}`}
              >
                <span>{dependency.name}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!disabled && !hasAnyDependencies ? (
        <EmptyState
          title="No dependencies match your search"
          description={
            normalizedSearch
              ? `No results found for "${normalizedSearch}". Try a broader keyword.`
              : 'No dependencies are available in the current metadata payload.'
          }
        />
      ) : null}

      {!disabled && hasAnyDependencies ? (
        <div className="space-y-3">
          {dependencyGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.category)

            return (
              <section key={group.category} className="space-y-2 rounded-lg border bg-[var(--card)] p-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-left transition hover:bg-[var(--muted)]"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {group.category}
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {group.dependencies.length} dependencies
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>

                {isExpanded ? (
                  <div className="grid grid-cols-1 gap-2">
                    {group.dependencies.map((dependency) => {
                      const isSelected = selectedIdSet.has(dependency.id)

                      return (
                        <button
                          key={dependency.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onToggleDependency(dependency.id)}
                          className={`w-full min-w-0 rounded-lg border px-3 py-2 text-left transition ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm' : 'bg-[var(--card)] hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]'} disabled:opacity-60`}
                        >
                          <p className="break-words text-sm font-semibold">
                            {dependency.name}
                          </p>
                          <p className={`mt-1 text-xs ${isSelected ? 'text-[var(--accent-foreground)]/80' : 'text-[var(--muted-foreground)]'}`}>
                            {dependency.description ?? 'No description available for this dependency.'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
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
