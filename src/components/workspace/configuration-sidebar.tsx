import { ChevronDown, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useInitializrMetadata } from '@/hooks/use-initializr-metadata'
import {
  BUILD_TOOL_OPTIONS,
  LANGUAGE_OPTIONS,
  PACKAGING_OPTIONS,
  getMetadataDrivenConfigOptions,
  type BuildTool,
  type PackagingType,
  type ProjectConfig,
  type ProjectLanguage,
} from '@/lib/project-config'

type ConfigurationSidebarProps = {
  config: ProjectConfig
  onConfigChange: (nextConfig: ProjectConfig) => void
}

export function ConfigurationSidebar({
  config,
  onConfigChange,
}: ConfigurationSidebarProps) {
  const [metadataOpen, setMetadataOpen] = useState(true)
  const [buildSettingsOpen, setBuildSettingsOpen] = useState(true)
  const metadataQuery = useInitializrMetadata()

  const metadataDrivenOptions = useMemo(
    () => getMetadataDrivenConfigOptions(metadataQuery.data),
    [metadataQuery.data],
  )

  const metadataUnavailable = metadataQuery.isLoading || !metadataQuery.data?.ok

  useEffect(() => {
    if (!metadataQuery.data?.ok) {
      return
    }

    const hasConfiguredJavaVersion = metadataDrivenOptions.javaVersions.some(
      (option) => option.value === config.javaVersion,
    )
    const hasConfiguredSpringBootVersion = metadataDrivenOptions.springBootVersions.some(
      (option) => option.value === config.springBootVersion,
    )

    if (hasConfiguredJavaVersion && hasConfiguredSpringBootVersion) {
      return
    }

    onConfigChange({
      ...config,
      javaVersion: hasConfiguredJavaVersion
        ? config.javaVersion
        : metadataDrivenOptions.defaults.javaVersion,
      springBootVersion: hasConfiguredSpringBootVersion
        ? config.springBootVersion
        : metadataDrivenOptions.defaults.springBootVersion,
    })
  }, [
    config,
    metadataDrivenOptions.defaults.javaVersion,
    metadataDrivenOptions.defaults.springBootVersion,
    metadataDrivenOptions.javaVersions,
    metadataDrivenOptions.springBootVersions,
    metadataQuery.data,
    onConfigChange,
  ])

  const setTextField =
    (field: 'group' | 'artifact' | 'name' | 'description' | 'packageName') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onConfigChange({
        ...config,
        [field]: event.target.value,
      })
    }

  const setSelectField =
    (field: 'javaVersion' | 'springBootVersion') =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onConfigChange({
        ...config,
        [field]: event.target.value,
      })
    }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Configuration Panel
        </p>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Configure project metadata and build defaults before preview and generation.
        </p>
      </div>

      <MetadataStatusBanner />

      <SidebarSection
        title="Project Metadata"
        description="Base identity and package coordinates"
        open={metadataOpen}
        onToggle={() => setMetadataOpen((current) => !current)}
      >
        <div className="grid gap-3">
          <SidebarInput label="Group" value={config.group} onChange={setTextField('group')} />
          <SidebarInput
            label="Artifact"
            value={config.artifact}
            onChange={setTextField('artifact')}
          />
          <SidebarInput label="Name" value={config.name} onChange={setTextField('name')} />
          <SidebarInput
            label="Description"
            value={config.description}
            onChange={setTextField('description')}
          />
          <SidebarInput
            label="Package Name"
            value={config.packageName}
            onChange={setTextField('packageName')}
          />
        </div>
      </SidebarSection>

      <SidebarSection
        title="Build Settings"
        description="Language, versions, and output package"
        open={buildSettingsOpen}
        onToggle={() => setBuildSettingsOpen((current) => !current)}
      >
        <div className="space-y-4">
          <SidebarSelect
            label="Java Version"
            value={config.javaVersion}
            options={metadataDrivenOptions.javaVersions}
            onChange={setSelectField('javaVersion')}
            disabled={metadataUnavailable}
          />
          <SidebarSelect
            label="Spring Boot"
            value={config.springBootVersion}
            options={metadataDrivenOptions.springBootVersions}
            onChange={setSelectField('springBootVersion')}
            disabled={metadataUnavailable}
          />

          <SidebarRadioGroup<BuildTool>
            label="Build Tool"
            value={config.buildTool}
            options={BUILD_TOOL_OPTIONS}
            onChange={(value) =>
              onConfigChange({
                ...config,
                buildTool: value,
              })
            }
          />
          <SidebarRadioGroup<ProjectLanguage>
            label="Language"
            value={config.language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) =>
              onConfigChange({
                ...config,
                language: value,
              })
            }
          />
          <SidebarRadioGroup<PackagingType>
            label="Packaging"
            value={config.packaging}
            options={PACKAGING_OPTIONS}
            onChange={(value) =>
              onConfigChange({
                ...config,
                packaging: value,
              })
            }
          />
        </div>
      </SidebarSection>
    </div>
  )
}

function MetadataStatusBanner() {
  const metadataQuery = useInitializrMetadata()

  if (metadataQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        Loading Java and Spring Boot options from the metadata service...
      </div>
    )
  }

  if (metadataQuery.isError) {
    return (
      <div className="rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-xs text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        Metadata is unavailable right now. Build version selects are temporarily disabled.
      </div>
    )
  }

  if (!metadataQuery.data?.ok) {
    return (
      <div className="rounded-lg border border-red-300/70 bg-red-50/70 px-3 py-2 text-xs text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">
        {metadataQuery.data?.error.message ??
          'Metadata is unavailable right now. Build version selects are temporarily disabled.'}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-emerald-300/70 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
      Java and Spring Boot options are synced from Spring Initializr metadata.
    </div>
  )
}

type SidebarSectionProps = {
  title: string
  description: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SidebarSection({
  title,
  description,
  open,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <section className="rounded-xl border bg-[var(--card)] p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  )
}

type SidebarInputProps = {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function SidebarInput({ label, value, onChange }: SidebarInputProps) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <input
        value={value}
        onChange={onChange}
        className="h-9 rounded-md border bg-[var(--background)] px-2.5 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  )
}

type SidebarSelectProps = {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
}

function SidebarSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SidebarSelectProps) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-9 rounded-md border bg-[var(--background)] px-2.5 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type SidebarRadioGroupProps<TValue extends string> = {
  label: string
  value: TValue
  options: { value: TValue; label: string }[]
  onChange: (value: TValue) => void
}

function SidebarRadioGroup<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: SidebarRadioGroupProps<TValue>) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-xs font-medium text-[var(--muted-foreground)]">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = option.value === value

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition ${active ? 'border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' : 'bg-[var(--background)] text-[var(--foreground)]'}`}
            >
              <input
                type="radio"
                name={label}
                checked={active}
                onChange={() => onChange(option.value)}
                className="accent-emerald-500"
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
