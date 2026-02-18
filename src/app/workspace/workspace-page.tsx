import { ChevronDown } from 'lucide-react'
import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDependencyBrowser } from '@/features/dependencies/hooks/use-dependency-browser'
import { useInitializrMetadata } from '@/features/configuration/hooks/use-initializr-metadata'
import {
  useProjectConfigState,
  type ProjectConfigUpdateOptions,
} from '@/features/configuration/hooks/use-project-config-state'
import { useProjectPreview } from '@/features/preview/hooks/use-project-preview'
import { useShareableConfig } from '@/features/share/hooks/use-shareable-config'
import {
  normalizeAgentsMdPreferences,
  getAgentsMdPreferenceIdsByGuidance,
  DEFAULT_AGENTS_MD_PREFERENCES,
  DEFAULT_AI_EXTRAS_TARGET,
  normalizeAiExtrasTarget,
  normalizeSelectedAiExtraIds,
  type AgentsMdGuidanceId,
  type AgentsMdPreferences,
  type AiSkillExtraId,
  type AiExtraId,
  type AiExtrasTarget,
} from '@/features/ai-extras/model/ai-extras'
import { applyCuratedPreset, resolveCuratedPresets } from '@/features/presets/model/curated-presets'
import { type PreviewFileDiff } from '@/features/preview/model/preview-diff'
import {
  DEFAULT_PROJECT_CONFIG,
  getMetadataDrivenConfigOptions,
  type ProjectConfig,
} from '@/shared/lib/project-config'
import { resolveDependencyPreviewDiff } from '@/features/dependencies/model/dependency-preview-diff'
import type { PreviewSnapshotFile } from '@/features/preview/model/preview-tree'
import { WorkspaceFinalizePanel } from '@/app/workspace/components/workspace-finalize-panel'
import { WorkspaceHeader } from '@/app/workspace/components/workspace-header'
import { ConfigurationSidebar } from '@/features/configuration/components/configuration-sidebar'
import { DependencyBrowser } from '@/features/dependencies/components/dependency-browser'
import { PresetLayoutSurface } from '@/features/presets/components/preset-layout-surface'

const AiExtrasPanel = lazy(async () => {
  const module = await import('@/features/ai-extras/components/ai-extras-panel')

  return { default: module.AiExtrasPanel }
})

const GitHubPublishDialog = lazy(async () => {
  const module = await import('@/features/github/components/github-publish-dialog')

  return { default: module.GitHubPublishDialog }
})

const FileContentViewer = lazy(async () => {
  const module = await import('@/features/preview/components/file-content-viewer')

  return { default: module.FileContentViewer }
})

const PreviewFileTree = lazy(async () => {
  const module = await import('@/features/preview/components/preview-file-tree')

  return { default: module.PreviewFileTree }
})

export function WorkspacePage() {
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
  const metadataDrivenOptions = useMemo(
    () => getMetadataDrivenConfigOptions(metadataQuery.data),
    [metadataQuery.data],
  )
  const metadataStatusMessage = useMemo(() => {
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
  }, [metadataQuery.data, metadataQuery.isError, metadataQuery.isLoading])
  const dependencyBrowser = useDependencyBrowser(availableDependencies)
  const resolvedPresets = useMemo(
    () => resolveCuratedPresets(availableDependencies),
    [availableDependencies],
  )
  const {
    restoredSnapshot,
    hasShareToken,
    createShareUrl,
    clearShareTokenFromUrl,
  } = useShareableConfig()
  const [selectedPreviewFilePath, setSelectedPreviewFilePath] = useState<string | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [appliedPresetDependencyIds, setAppliedPresetDependencyIds] = useState<string[]>([])
  const [selectedAiExtraIds, setSelectedAiExtraIds] = useState<AiExtraId[]>([])
  const [aiExtrasTarget, setAiExtrasTarget] = useState<AiExtrasTarget>(
    DEFAULT_AI_EXTRAS_TARGET,
  )
  const [agentsMdPreferences, setAgentsMdPreferences] = useState<AgentsMdPreferences>(
    DEFAULT_AGENTS_MD_PREFERENCES,
  )
  const [dependenciesOpen, setDependenciesOpen] = useState(true)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const hasAppliedSharedSnapshotRef = useRef(false)
  const initialSessionConfigRef = useRef<ProjectConfig | null>(null)

  if (initialSessionConfigRef.current === null) {
    initialSessionConfigRef.current = projectConfig
  }
  const dependencyDiffBaselinePreviewQuery = useProjectPreview({
    config: DEFAULT_PROJECT_CONFIG,
    selectedDependencyIds: [],
    selectedAiExtraIds,
    agentsMdPreferences,
    aiExtrasTarget,
  })
  const projectPreviewQuery = useProjectPreview({
    config: projectConfig,
    selectedDependencyIds: dependencyBrowser.selectedDependencyIds,
    selectedAiExtraIds,
    agentsMdPreferences,
    aiExtrasTarget,
  })

  const dependencyDiff = useMemo(
    () =>
      resolveDependencyPreviewDiff(
        dependencyDiffBaselinePreviewQuery.data,
        projectPreviewQuery.data,
      ),
    [dependencyDiffBaselinePreviewQuery.data, projectPreviewQuery.data],
  )
  const previewResult = projectPreviewQuery.data
  const previewFiles = previewResult?.ok ? previewResult.snapshot.files : undefined
  const previewFileMap = useMemo(() => {
    const map = new Map<string, PreviewSnapshotFile>()

    for (const file of previewFiles ?? []) {
      map.set(file.path, file)
    }

    return map
  }, [previewFiles])
  const previewErrorMessage =
    previewResult && !previewResult.ok
      ? previewResult.error.message
      : projectPreviewQuery.error
        ? projectPreviewQuery.error.message
        : undefined
  const selectedPreviewFile = useMemo(
    () =>
      selectedPreviewFilePath
        ? previewFileMap.get(selectedPreviewFilePath) ?? null
        : null,
    [previewFileMap, selectedPreviewFilePath],
  )
  const previewFileDiffByPath = useMemo(() => dependencyDiff?.files, [dependencyDiff])
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

    void setConfig(restoredSnapshot.config, { persistToUrl: false })
    dependencyBrowser.setSelectedDependencyIds(restoredSnapshot.selectedDependencyIds)
    setSelectedAiExtraIds(restoredSnapshot.selectedAiExtraIds)
    setAgentsMdPreferences(restoredSnapshot.agentsMdPreferences)
    setAiExtrasTarget(normalizeAiExtrasTarget(restoredSnapshot.aiExtrasTarget))

    clearShareTokenFromUrl()
  }, [
    clearShareTokenFromUrl,
    dependencyBrowser,
    hasShareToken,
    restoredSnapshot,
    setConfig,
    setAiExtrasTarget,
    setAgentsMdPreferences,
    setSelectedAiExtraIds,
  ])

  useEffect(() => {
    if (!selectedPreviewFilePath || !previewFiles) {
      return
    }

    const fileStillExists = previewFiles.some((file) => file.path === selectedPreviewFilePath)

    if (!fileStillExists) {
      setSelectedPreviewFilePath(null)
    }
  }, [previewFiles, selectedPreviewFilePath])

  const handleConfigChange = useCallback(
    (nextConfig: ProjectConfig, options?: ProjectConfigUpdateOptions) => {
      void setConfig(nextConfig, options)
    },
    [setConfig],
  )

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

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const currentSelectedDependencyIds = dependencyBrowser.selectedDependencyIds
      const appliedDependencySet = new Set(appliedPresetDependencyIds)
      const baseDependencySelection =
        appliedDependencySet.size === 0
          ? currentSelectedDependencyIds
          : currentSelectedDependencyIds.filter(
              (dependencyId) => !appliedDependencySet.has(dependencyId),
            )

      if (selectedPresetId === presetId) {
        setSelectedPresetId(null)
        setAppliedPresetDependencyIds([])
        dependencyBrowser.setSelectedDependencyIds(baseDependencySelection)
        return
      }

      const result = applyCuratedPreset(baseDependencySelection, presetId, resolvedPresets)

      if (!result.ok) {
        return
      }

      const baseDependencySet = new Set(baseDependencySelection)
      const nextAppliedPresetDependencyIds = result.nextSelectedDependencyIds.filter(
        (dependencyId) => !baseDependencySet.has(dependencyId),
      )

      setSelectedPresetId(presetId)
      setAppliedPresetDependencyIds(nextAppliedPresetDependencyIds)
      dependencyBrowser.setSelectedDependencyIds(result.nextSelectedDependencyIds)
    },
    [appliedPresetDependencyIds, dependencyBrowser, resolvedPresets, selectedPresetId],
  )
  const handleToggleAgentsMdEnabled = useCallback(() => {
    setSelectedAiExtraIds((currentIds) => {
      if (currentIds.includes('agents-md')) {
        return currentIds.filter((currentId) => currentId !== 'agents-md')
      }

      return normalizeSelectedAiExtraIds([...currentIds, 'agents-md'])
    })
  }, [])
  const handleToggleAiSkill = useCallback((skillId: AiSkillExtraId) => {
    setSelectedAiExtraIds((currentIds) => {
      if (currentIds.includes(skillId)) {
        return normalizeSelectedAiExtraIds(
          currentIds.filter((currentId) => currentId !== skillId),
        )
      }

      return normalizeSelectedAiExtraIds([...currentIds, skillId])
    })
  }, [])
  const handleToggleAgentsMdGuidance = useCallback((guidanceId: AgentsMdGuidanceId) => {
    const preferenceIds = getAgentsMdPreferenceIdsByGuidance(guidanceId)

    setAgentsMdPreferences((currentPreferences) => {
      const shouldEnable = preferenceIds.some((preferenceId) => !currentPreferences[preferenceId])
      const nextPreferences: Partial<AgentsMdPreferences> = { ...currentPreferences }

      for (const preferenceId of preferenceIds) {
        nextPreferences[preferenceId] = shouldEnable
      }

      return normalizeAgentsMdPreferences(nextPreferences)
    })
  }, [])
  const handleToggleAgentsMdPreference = useCallback(
    (preferenceId: keyof AgentsMdPreferences) => {
      setAgentsMdPreferences((currentPreferences) =>
        normalizeAgentsMdPreferences({
          ...currentPreferences,
          [preferenceId]: !currentPreferences[preferenceId],
        }),
      )
    },
    [],
  )
  const handleChangeAiExtrasTarget = useCallback((nextTarget: AiExtrasTarget) => {
    setAiExtrasTarget((currentTarget) =>
      currentTarget === nextTarget ? currentTarget : nextTarget,
    )
  }, [])

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

  const handleRetryPreview = useCallback(() => {
    void projectPreviewQuery.refetch()
  }, [projectPreviewQuery.refetch])
  const handleSelectPreviewFile = useCallback((path: string | null) => {
    setSelectedPreviewFilePath(path)
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
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                availableDependencies={availableDependencies}
                metadataAvailable={metadataReady}
                selectedDependencyCount={dependencyBrowser.selectedDependencyCount}
                disabled={metadataUnavailable}
              />
              <Suspense fallback={<FeaturePanelFallback label="Loading AI extras..." />}>
                <AiExtrasPanel
                  selectedAiExtraIds={selectedAiExtraIds}
                  aiExtrasTarget={aiExtrasTarget}
                  agentsMdPreferences={agentsMdPreferences}
                  onChangeAiExtrasTarget={handleChangeAiExtrasTarget}
                  onToggleAgentsMdEnabled={handleToggleAgentsMdEnabled}
                  onToggleAgentsMdGuidance={handleToggleAgentsMdGuidance}
                  onToggleAgentsMdPreference={handleToggleAgentsMdPreference}
                  onToggleAiSkill={handleToggleAiSkill}
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
                  files={previewFiles}
                  isLoading={projectPreviewQuery.isPending}
                  errorMessage={previewErrorMessage}
                  selectedFilePath={selectedPreviewFilePath}
                  onSelectFile={handleSelectPreviewFile}
                  fileDiffByPath={previewFileDiffByPath}
                  onRetry={handleRetryPreview}
                />

                <PreviewContentPanel
                  file={selectedPreviewFile}
                  isLoading={projectPreviewQuery.isPending}
                  diff={selectedFileDiff}
                  onRetry={handleRetryPreview}
                />
              </div>

              <WorkspaceFinalizePanel
                config={projectConfig}
                selectedDependencyIds={dependencyBrowser.selectedDependencyIds}
                selectedAiExtraIds={selectedAiExtraIds}
                agentsMdPreferences={agentsMdPreferences}
                aiExtrasTarget={aiExtrasTarget}
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
              selectedAiExtraIds={selectedAiExtraIds}
              agentsMdPreferences={agentsMdPreferences}
              aiExtrasTarget={aiExtrasTarget}
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

function FeaturePanelFallback({ label }: { label: string }) {
  return (
    <div className="rounded-xl border bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
      {label}
    </div>
  )
}

function isProjectConfigEqual(left: ProjectConfig, right: ProjectConfig): boolean {
  return (
    left.group === right.group &&
    left.artifact === right.artifact &&
    left.name === right.name &&
    left.description === right.description &&
    left.packageName === right.packageName &&
    left.javaVersion === right.javaVersion &&
    left.springBootVersion === right.springBootVersion &&
    left.buildTool === right.buildTool &&
    left.language === right.language &&
    left.packaging === right.packaging
  )
}

type PreviewExplorerPanelProps = {
  files: PreviewSnapshotFile[] | undefined
  isLoading: boolean
  errorMessage?: string
  selectedFilePath: string | null
  onSelectFile: (path: string | null) => void
  fileDiffByPath?: Record<string, PreviewFileDiff>
  onRetry: () => void
}

const PreviewExplorerPanel = memo(function PreviewExplorerPanel({
  files,
  isLoading,
  errorMessage,
  selectedFilePath,
  onSelectFile,
  fileDiffByPath,
  onRetry,
}: PreviewExplorerPanelProps) {
  return (
    <Suspense fallback={<FeaturePanelFallback label="Loading preview explorer..." />}>
      <PreviewFileTree
        files={files}
        isLoading={isLoading}
        errorMessage={errorMessage}
        selectedFilePath={selectedFilePath}
        onSelectFile={onSelectFile}
        fileDiffByPath={fileDiffByPath}
        onRetry={onRetry}
      />
    </Suspense>
  )
})

type PreviewContentPanelProps = {
  file: PreviewSnapshotFile | null
  isLoading: boolean
  diff: PreviewFileDiff | null
  onRetry: () => void
}

const PreviewContentPanel = memo(function PreviewContentPanel({
  file,
  isLoading,
  diff,
  onRetry,
}: PreviewContentPanelProps) {
  return (
    <Suspense fallback={<FeaturePanelFallback label="Loading file viewer..." />}>
      <FileContentViewer
        file={file}
        isLoading={isLoading}
        diff={diff}
        onRetry={onRetry}
      />
    </Suspense>
  )
})

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
    return null
  }

  if (isError || (!metadataReady && Boolean(message))) {
    return (
      <div className="mt-3 rounded-lg border border-red-400/80 bg-red-100 px-3 py-2 text-xs text-red-950 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        {message ?? 'Dependency metadata is unavailable. Dependency selection is disabled.'}
      </div>
    )
  }

  return null
}
