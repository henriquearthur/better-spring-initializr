import { ChevronDown } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import { WorkspaceFinalizePanel } from '@/app/workspace/components/workspace-finalize-panel'
import { WorkspaceHeader } from '@/app/workspace/components/workspace-header'
import { useAiExtrasState } from '@/features/ai-extras/hooks/use-ai-extras-state'
import { normalizeAiExtrasTarget } from '@/features/ai-extras/model/ai-extras'
import { ConfigurationSidebar } from '@/features/configuration/components/configuration-sidebar'
import { useInitializrMetadata } from '@/features/configuration/hooks/use-initializr-metadata'
import {
  type ProjectConfigUpdateOptions,
  useProjectConfigState,
} from '@/features/configuration/hooks/use-project-config-state'
import { DependencyBrowser } from '@/features/dependencies/components/dependency-browser'
import { DependencyBrowserStatus, type MetadataStatus } from '@/features/dependencies/components/dependency-browser-status'
import { useDependencyBrowser } from '@/features/dependencies/hooks/use-dependency-browser'
import { PresetLayoutSurface } from '@/features/presets/components/preset-layout-surface'
import { usePresetSelection } from '@/features/presets/hooks/use-preset-selection'
import { resolveCuratedPresets } from '@/features/presets/model/curated-presets'
import { PreviewContentPanel } from '@/features/preview/components/preview-content-panel'
import { PreviewExplorerPanel } from '@/features/preview/components/preview-explorer-panel'
import { usePreviewState } from '@/features/preview/hooks/use-preview-state'
import { useShareableConfig } from '@/features/share/hooks/use-shareable-config'
import {
  getMetadataDrivenConfigOptions,
  isProjectConfigEqual,
  type ProjectConfig,
} from '@/shared/lib/project-config'
import { FeaturePanelFallback } from '@/shared/ui/feature-panel-fallback'

const AiExtrasPanel = lazy(async () => {
  const module = await import('@/features/ai-extras/components/ai-extras-panel')

  return { default: module.AiExtrasPanel }
})

const GitHubPublishDialog = lazy(async () => {
  const module = await import('@/features/github/components/github-publish-dialog')

  return { default: module.GitHubPublishDialog }
})

export function WorkspacePage() {
  const metadataQuery = useInitializrMetadata()
  const { config: projectConfig, setConfig, setField, resetConfig } =
    useProjectConfigState()

  const metadataReady = metadataQuery.data?.ok === true
  const availableDependencies = (() => {
    const metadataResult = metadataQuery.data

    if (!metadataResult || !metadataResult.ok) {
      return []
    }

    return metadataResult.metadata.dependencies
  })()

  const metadataStatus: MetadataStatus = (() => {
    if (metadataQuery.isLoading) {
      return { type: 'loading' }
    }

    if (metadataQuery.isError || !metadataReady) {
      const metadataResult = metadataQuery.data
      const message = metadataResult && !metadataResult.ok
        ? metadataResult.error.message
        : undefined

      return { type: 'error', message }
    }

    return { type: 'ready' }
  })()
  const metadataDrivenOptions = getMetadataDrivenConfigOptions(metadataQuery.data)
  const metadataStatusMessage = (() => {
    if (metadataQuery.isLoading) {
      return undefined
    }

    if (metadataQuery.isError) {
      return 'Metadata is unavailable right now. Build version selects are temporarily disabled.'
    }

    if (metadataQuery.data && !metadataQuery.data.ok) {
      return (
        metadataQuery.data.error.message ??
        'Metadata is unavailable right now. Build version selects are temporarily disabled.'
      )
    }

    return undefined
  })()
  const dependencyBrowser = useDependencyBrowser(availableDependencies)
  const resolvedPresets = resolveCuratedPresets(availableDependencies)
  const {
    restoredSnapshot,
    hasShareToken,
    createShareUrl,
    clearShareTokenFromUrl,
  } = useShareableConfig()
  const presetSelection = usePresetSelection({
    resolvedPresets,
    getSelectedDependencyIds: () => dependencyBrowser.selectedDependencyIds,
    setSelectedDependencyIds: dependencyBrowser.setSelectedDependencyIds,
  })
  const aiExtras = useAiExtrasState()
  const preview = usePreviewState({
    config: projectConfig,
    selectedDependencyIds: dependencyBrowser.selectedDependencyIds,
    selectedAiExtraIds: aiExtras.selectedAiExtraIds,
    agentsMdPreferences: aiExtras.agentsMdPreferences,
    aiExtrasTarget: aiExtras.aiExtrasTarget,
  })
  const [dependenciesOpen, setDependenciesOpen] = useState(true)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const hasAppliedSharedSnapshotRef = useRef(false)
  const initialSessionConfigRef = useRef<ProjectConfig | null>(null)

  if (initialSessionConfigRef.current === null) {
    initialSessionConfigRef.current = projectConfig
  }

  useEffect(() => {
    if (hasAppliedSharedSnapshotRef.current || !hasShareToken) {
      return
    }

    hasAppliedSharedSnapshotRef.current = true

    if (!restoredSnapshot) {
      clearShareTokenFromUrl()
      return
    }

    void setConfig(restoredSnapshot.config, { persistToUrl: false })
    dependencyBrowser.setSelectedDependencyIds(restoredSnapshot.selectedDependencyIds)
    aiExtras.setSelectedAiExtraIds(restoredSnapshot.selectedAiExtraIds)
    aiExtras.setAgentsMdPreferences(restoredSnapshot.agentsMdPreferences)
    aiExtras.setAiExtrasTarget(normalizeAiExtrasTarget(restoredSnapshot.aiExtrasTarget))

    clearShareTokenFromUrl()
  }, [
    clearShareTokenFromUrl,
    dependencyBrowser,
    hasShareToken,
    restoredSnapshot,
    setConfig,
    aiExtras,
  ])

  const handleConfigChange = (nextConfig: ProjectConfig, options?: ProjectConfigUpdateOptions) => {
    void setConfig(nextConfig, options)
  }

  const handleFieldChange = (field: keyof ProjectConfig, value: string) => {
    void setField(field, value)
  }

  const handleResetConfig = () => {
    void resetConfig()
  }

  const handleSearchTermChange = (value: string) => {
    dependencyBrowser.setSearchTerm(value)
  }

  const metadataUnavailable = metadataQuery.isLoading || metadataQuery.isError || !metadataReady

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const githubState = params.get('github')

    if (githubState === 'connected') {
      setPublishDialogOpen(true)
    }

    if (params.has('github')) {
      params.delete('github')
      replaceSearchParams(params)
    }
  }, [])

  const resetBaselineConfig =
    restoredSnapshot?.config ?? initialSessionConfigRef.current ?? projectConfig
  const hasConfigChanges = !isProjectConfigEqual(projectConfig, resetBaselineConfig)
  const dependencyBrowserContent = (
    <>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={dependencyBrowser.clearSelectedDependencies}
          disabled={metadataUnavailable || dependencyBrowser.selectedDependencyCount === 0}
          className="btn btn-secondary btn-sm h-7 text-[11px] text-[var(--muted-foreground)]"
        >
          Clear all
        </button>
      </div>

      <DependencyBrowserStatus status={metadataStatus} />

      <div className="mt-3">
        <DependencyBrowser
          dependencyGroups={dependencyBrowser.filteredDependencyCategories}
          searchTerm={dependencyBrowser.searchTerm}
          onSearchTermChange={handleSearchTermChange}
          selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
          onToggleDependency={dependencyBrowser.toggleDependency}
          disabled={metadataUnavailable}
        />
      </div>
    </>
  )
  const dependencyBrowserSection = (
    <section className="rounded-xl border bg-[var(--card)] p-3">
      <button
        type="button"
        onClick={() => setDependenciesOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition hover:bg-[var(--muted)]"
      >
        <div>
          <p className="text-sm font-semibold">Dependency Browser</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Search and pick Spring dependencies for this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {dependencyBrowser.selectedDependencyCount} selected
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${dependenciesOpen ? '' : '-rotate-90'}`}
          />
        </div>
      </button>

      {dependenciesOpen ? dependencyBrowserContent : null}
    </section>
  )
  const previewLayoutClass = 'lg:grid-cols-[320px_minmax(0,1fr)]'

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
                showReset={hasConfigChanges}
                metadataDrivenOptions={metadataDrivenOptions}
                metadataUnavailable={metadataUnavailable}
                metadataStatusMessage={metadataStatusMessage}
              />
              {dependencyBrowserSection}
            </aside>

            <section className="space-y-4">
              <PresetLayoutSurface
                presets={resolvedPresets}
                selectedPresetId={presetSelection.selectedPresetId}
                onSelectPreset={presetSelection.selectPreset}
                availableDependencies={availableDependencies}
                metadataAvailable={metadataReady}
                selectedDependencyCount={dependencyBrowser.selectedDependencyCount}
                disabled={metadataUnavailable}
              />
              <Suspense fallback={<FeaturePanelFallback label="Loading AI extras..." />}>
                <AiExtrasPanel
                  selectedAiExtraIds={aiExtras.selectedAiExtraIds}
                  aiExtrasTarget={aiExtras.aiExtrasTarget}
                  agentsMdPreferences={aiExtras.agentsMdPreferences}
                  onChangeAiExtrasTarget={aiExtras.changeAiExtrasTarget}
                  onToggleAllAiPowerUp={aiExtras.toggleAllAiPowerUp}
                  onToggleAgentsMdEnabled={aiExtras.toggleAgentsMdEnabled}
                  onToggleAgentsMdGuidance={aiExtras.toggleAgentsMdGuidance}
                  onToggleAgentsMdPreference={aiExtras.toggleAgentsMdPreference}
                  onToggleAiSkill={aiExtras.toggleAiSkill}
                />
              </Suspense>

              <div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Main Preview
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {projectConfig.group}.{projectConfig.artifact} ({projectConfig.language} /{' '}
                    {projectConfig.buildTool})
                  </p>
                </div>
              </div>

              <div className={`grid h-[760px] grid-cols-1 gap-4 md:h-[820px] lg:h-[560px] ${previewLayoutClass}`}>
                <PreviewExplorerPanel
                  files={preview.files}
                  isLoading={preview.isLoading}
                  errorMessage={preview.errorMessage}
                  selectedFilePath={preview.selectedFilePath}
                  onSelectFile={preview.selectFile}
                  fileDiffByPath={preview.fileDiffByPath}
                  onRetry={preview.retryPreview}
                />

                <PreviewContentPanel
                  file={preview.selectedFile}
                  isLoading={preview.isLoading}
                  diff={preview.selectedFileDiff}
                  onRetry={preview.retryPreview}
                />
              </div>

              <WorkspaceFinalizePanel
                config={projectConfig}
                selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
                selectedAiExtraIds={aiExtras.selectedAiExtraIds}
                agentsMdPreferences={aiExtras.agentsMdPreferences}
                aiExtrasTarget={aiExtras.aiExtrasTarget}
                createShareUrl={createShareUrl}
                onPublish={() => setPublishDialogOpen(true)}
              />
            </section>
          </main>
        </div>

        {publishDialogOpen ? (
          <Suspense fallback={null}>
            <GitHubPublishDialog
              open={publishDialogOpen}
              onClose={() => setPublishDialogOpen(false)}
              config={projectConfig}
              selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
              selectedAiExtraIds={aiExtras.selectedAiExtraIds}
              agentsMdPreferences={aiExtras.agentsMdPreferences}
              aiExtrasTarget={aiExtras.aiExtrasTarget}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  )
}

function replaceSearchParams(params: URLSearchParams) {
  const queryString = params.toString()
  const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.replaceState({}, '', nextUrl)
}
