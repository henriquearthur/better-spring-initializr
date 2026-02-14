import { useCallback, useMemo } from 'react'

import { useDependencyBrowser } from '@/hooks/use-dependency-browser'
import { useInitializrMetadata } from '@/hooks/use-initializr-metadata'
import { useProjectConfigState } from '@/hooks/use-project-config-state'
import type { ProjectConfig } from '@/lib/project-config'
import { ConfigurationSidebar } from './configuration-sidebar'
import { DependencyBrowser } from './dependency-browser'
import { WorkspaceHeader } from './workspace-header'

export function WorkspaceShell() {
  const metadataQuery = useInitializrMetadata()
  const { config: projectConfig, setConfig, setField, resetConfig } =
    useProjectConfigState()

  const metadataReady = metadataQuery.data?.ok === true
  const availableDependencies = useMemo(() => {
    const metadataResult = metadataQuery.data

    if (!metadataResult || !metadataResult.ok) {
      return []
    }

    return metadataResult.metadata.dependencies
  }, [metadataQuery.data])

  const metadataErrorMessage = useMemo(() => {
    const metadataResult = metadataQuery.data

    if (metadataResult && !metadataResult.ok) {
      return metadataResult.error.message
    }

    return undefined
  }, [metadataQuery.data])
  const dependencyBrowser = useDependencyBrowser(availableDependencies)

  const handleConfigChange = useCallback((nextConfig: ProjectConfig) => {
    void setConfig(nextConfig)
  }, [setConfig])

  const handleFieldChange = useCallback(
    (field: keyof ProjectConfig, value: string) => {
      void setField(field, value)
    },
    [setField],
  )

  const handleResetConfig = useCallback(() => {
    void resetConfig()
  }, [resetConfig])

  const handleSearchTermChange = useCallback(
    (value: string) => {
      dependencyBrowser.setSearchTerm(value)
    },
    [dependencyBrowser],
  )

  const metadataUnavailable = metadataQuery.isLoading || metadataQuery.isError || !metadataReady

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/12 to-transparent" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border bg-[var(--card)] shadow-[0_12px_40px_-20px_rgba(16,24,40,0.55)]">
          <WorkspaceHeader />

          <main className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4 rounded-xl border bg-[var(--background)] p-4">
              <ConfigurationSidebar
                config={projectConfig}
                onConfigChange={handleConfigChange}
                onFieldChange={handleFieldChange}
                onResetConfig={handleResetConfig}
              />

              <section className="rounded-xl border bg-[var(--card)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Dependency Browser</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Search and pick Spring dependencies for this project.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                      {dependencyBrowser.selectedDependencyCount} selected
                    </span>
                    <button
                      type="button"
                      onClick={dependencyBrowser.clearSelectedDependencies}
                      disabled={
                        metadataUnavailable || dependencyBrowser.selectedDependencyCount === 0
                      }
                      className="h-7 rounded-md border px-2.5 text-[11px] font-medium text-[var(--muted-foreground)] transition hover:border-emerald-500/40 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-emerald-300"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <DependencyBrowserStatus
                  isLoading={metadataQuery.isLoading}
                  isError={metadataQuery.isError}
                  metadataReady={metadataReady}
                  message={metadataErrorMessage}
                />

                <div className="mt-3">
                  <DependencyBrowser
                    dependencyGroups={dependencyBrowser.filteredDependencyCategories}
                    searchTerm={dependencyBrowser.searchTerm}
                    onSearchTermChange={handleSearchTermChange}
                    selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
                    onToggleDependency={dependencyBrowser.toggleDependency}
                    hasMetadata={metadataReady}
                    disabled={metadataUnavailable}
                  />
                </div>
              </section>
            </aside>

            <section className="rounded-xl border bg-[var(--background)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Main Preview
              </p>
              <div className="mt-4 flex h-[360px] items-center justify-center rounded-xl border border-dashed text-sm text-[var(--muted-foreground)] md:h-[520px]">
                <div className="space-y-2 text-left">
                  <p className="font-medium text-[var(--foreground)]">Live preview coming next phases</p>
                  <p>Current coordinates:</p>
                  <p>
                    {projectConfig.group}.{projectConfig.artifact} ({projectConfig.language} /{' '}
                    {projectConfig.buildTool})
                  </p>
                  <p>
                    Java {projectConfig.javaVersion} · Boot {projectConfig.springBootVersion} ·{' '}
                    {projectConfig.packaging.toUpperCase()}
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

type DependencyBrowserStatusProps = {
  isLoading: boolean
  isError: boolean
  metadataReady: boolean
  message?: string
}

function DependencyBrowserStatus({
  isLoading,
  isError,
  metadataReady,
  message,
}: DependencyBrowserStatusProps) {
  if (isLoading) {
    return (
      <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        Loading dependency metadata from Spring Initializr...
      </div>
    )
  }

  if (isError || !metadataReady) {
    return (
      <div className="mt-3 rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-xs text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        {message ?? 'Dependency metadata is unavailable. Dependency selection is disabled.'}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-emerald-300/70 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
      Dependency metadata loaded. Search and toggle dependencies below.
    </div>
  )
}
