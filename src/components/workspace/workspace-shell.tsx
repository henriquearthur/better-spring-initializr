import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDependencyBrowser } from '@/hooks/use-dependency-browser'
import { useInitializrMetadata } from '@/hooks/use-initializr-metadata'
import { useProjectConfigState } from '@/hooks/use-project-config-state'
import { useProjectPreview } from '@/hooks/use-project-preview'
import { useShareableConfig } from '@/hooks/use-shareable-config'
import { CURATED_PRESETS, applyCuratedPreset } from '@/lib/curated-presets'
import { computePreviewDiff } from '@/lib/preview-diff'
import type { ProjectConfig } from '@/lib/project-config'
import type { PreviewSnapshotFile } from '@/lib/preview-tree'
import { ConfigurationSidebar } from './configuration-sidebar'
import { DependencyBrowser } from './dependency-browser'
import { FileContentViewer } from './file-content-viewer'
import { GitHubPublishDialog } from './github-publish-dialog'
import { PresetBrowser } from './preset-browser'
import { PreviewFileTree } from './preview-file-tree'
import { WorkspaceOutputActions } from './workspace-output-actions'
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
  const {
    restoredSnapshot,
    hasShareToken,
    createShareUrl,
    clearShareTokenFromUrl,
  } = useShareableConfig()
  const [selectedPreviewFilePath, setSelectedPreviewFilePath] = useState<string | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(CURATED_PRESETS[0]?.id ?? null)
  const [dependencyDiffBaseline, setDependencyDiffBaseline] = useState<{
    generatedAt: string
    files: PreviewSnapshotFile[]
  } | null>(null)
  const [dependencyDiff, setDependencyDiff] = useState<ReturnType<typeof computePreviewDiff> | null>(
    null,
  )
  const dependencySelectionKey = useMemo(
    () => dependencyBrowser.selectedDependencyIds.join(','),
    [dependencyBrowser.selectedDependencyIds],
  )
  const previousDependencySelectionKeyRef = useRef(dependencySelectionKey)
  const hasAppliedSharedSnapshotRef = useRef(false)

  const projectPreviewQuery = useProjectPreview({
    config: projectConfig,
    selectedDependencyIds: dependencyBrowser.selectedDependencyIds,
  })

  const previewResult = projectPreviewQuery.data
  const previewFiles = previewResult?.ok ? previewResult.snapshot.files : undefined
  const previewErrorMessage =
    previewResult && !previewResult.ok
      ? previewResult.error.message
      : projectPreviewQuery.error
        ? projectPreviewQuery.error.message
        : undefined
  const selectedPreviewFile = useMemo(
    () => previewFiles?.find((file) => file.path === selectedPreviewFilePath) ?? null,
    [previewFiles, selectedPreviewFilePath],
  )
  const selectedFileDiff =
    selectedPreviewFilePath && dependencyDiff
      ? dependencyDiff.files[selectedPreviewFilePath] ?? null
      : null

  useEffect(() => {
    if (hasAppliedSharedSnapshotRef.current || !hasShareToken) {
      return
    }

    hasAppliedSharedSnapshotRef.current = true

    if (!restoredSnapshot) {
      clearShareTokenFromUrl()
      return
    }

    void setConfig(restoredSnapshot.config)
    dependencyBrowser.setSelectedDependencyIds(restoredSnapshot.selectedDependencyIds)

    clearShareTokenFromUrl()
  }, [
    clearShareTokenFromUrl,
    dependencyBrowser,
    hasShareToken,
    restoredSnapshot,
    setConfig,
  ])

  useEffect(() => {
    if (previousDependencySelectionKeyRef.current === dependencySelectionKey) {
      return
    }

    previousDependencySelectionKeyRef.current = dependencySelectionKey

    if (previewResult?.ok) {
      setDependencyDiffBaseline({
        generatedAt: previewResult.snapshot.generatedAt,
        files: previewResult.snapshot.files,
      })
    } else {
      setDependencyDiffBaseline(null)
    }

    setDependencyDiff(null)
  }, [dependencySelectionKey, previewResult])

  useEffect(() => {
    if (!previewResult?.ok || !dependencyDiffBaseline) {
      return
    }

    if (previewResult.snapshot.generatedAt === dependencyDiffBaseline.generatedAt) {
      return
    }

    setDependencyDiff(computePreviewDiff(dependencyDiffBaseline.files, previewResult.snapshot.files))
    setDependencyDiffBaseline(null)
  }, [dependencyDiffBaseline, previewResult])

  useEffect(() => {
    if (!selectedPreviewFilePath || !previewFiles) {
      return
    }

    const fileStillExists = previewFiles.some((file) => file.path === selectedPreviewFilePath)

    if (!fileStillExists) {
      setSelectedPreviewFilePath(null)
    }
  }, [previewFiles, selectedPreviewFilePath])

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

  const handleSelectPreset = useCallback((presetId: string) => {
    setSelectedPresetId(presetId)
  }, [])

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const result = applyCuratedPreset(dependencyBrowser.selectedDependencyIds, presetId)

      if (!result.ok) {
        return
      }

      setSelectedPresetId(presetId)
      dependencyBrowser.setSelectedDependencyIds(result.nextSelectedDependencyIds)
    },
    [dependencyBrowser],
  )

  const metadataUnavailable = metadataQuery.isLoading || metadataQuery.isError || !metadataReady

  const [presetsOpen, setPresetsOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('github') === 'connected') {
      setPublishDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.has('github')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleRetryPreview = useCallback(() => {
    void projectPreviewQuery.refetch()
  }, [projectPreviewQuery])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/12 to-transparent" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6">
        <WorkspaceHeader />

        <div className="overflow-hidden rounded-2xl border bg-[var(--card)] shadow-[0_12px_40px_-20px_rgba(16,24,40,0.55)]">
          <main className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <ConfigurationSidebar
                config={projectConfig}
                onConfigChange={handleConfigChange}
                onFieldChange={handleFieldChange}
                onResetConfig={handleResetConfig}
              />

              <section className="rounded-xl border bg-[var(--card)] p-3">
                <button
                  type="button"
                  onClick={() => setPresetsOpen((current) => !current)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-semibold">Curated Presets</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Inspect what each starter includes, then apply in one click.
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${presetsOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {presetsOpen ? (
                  <div className="mt-3">
                    <PresetBrowser
                      presets={CURATED_PRESETS}
                      selectedPresetId={selectedPresetId}
                      onSelectPreset={handleSelectPreset}
                      onApplyPreset={handleApplyPreset}
                      availableDependencies={availableDependencies}
                      metadataAvailable={metadataReady}
                      disabled={metadataUnavailable}
                    />
                  </div>
                ) : null}
              </section>

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

            <section className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Main Preview
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {projectConfig.group}.{projectConfig.artifact} ({projectConfig.language} /{' '}
                    {projectConfig.buildTool})
                  </p>
                </div>

                <div className="rounded-lg border bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  {selectedPreviewFile ? (
                    <p>
                      Selected: <span className="font-mono">{selectedPreviewFile.path}</span> ({selectedPreviewFile.size} bytes)
                    </p>
                  ) : (
                    <p>Select a file to inspect its path and size.</p>
                  )}
                </div>
              </div>

              <WorkspaceOutputActions
                config={projectConfig}
                selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
                createShareUrl={createShareUrl}
                onPublish={() => setPublishDialogOpen(true)}
              />

              {dependencyDiff ? (
                <div className="rounded-lg border bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  <p>
                    Dependency diff: {dependencyDiff.modified.length} modified, {dependencyDiff.added.length} added,{' '}
                    {dependencyDiff.removed.length} removed files.
                  </p>
                </div>
              ) : null}

              <div className="grid h-[360px] grid-cols-1 gap-4 md:h-[520px] xl:grid-cols-[320px_minmax(0,1fr)]">
                <PreviewFileTree
                  files={previewFiles}
                  isLoading={projectPreviewQuery.isPending}
                  errorMessage={previewErrorMessage}
                  selectedFilePath={selectedPreviewFilePath}
                  onSelectFile={setSelectedPreviewFilePath}
                  fileDiffByPath={dependencyDiff?.files}
                  onRetry={handleRetryPreview}
                />

                <FileContentViewer
                  file={selectedPreviewFile}
                  isLoading={projectPreviewQuery.isPending}
                  diff={selectedFileDiff}
                  onRetry={handleRetryPreview}
                />
              </div>
            </section>
          </main>
        </div>

        <GitHubPublishDialog
          open={publishDialogOpen}
          onClose={() => setPublishDialogOpen(false)}
          config={projectConfig}
          selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
        />
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

  return null
}
